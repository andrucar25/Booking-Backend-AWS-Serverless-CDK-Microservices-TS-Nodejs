import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { PutItemCommand, DynamoDBClient, GetItemCommand } from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

import { ulid } from "../../../layers/utils/nodejs/node_modules/ulidx";
import { createHTTPResponse } from '../../../layers/utils/nodejs/utils/httpResponse';

const dynamoDbClient = new DynamoDBClient({region: process.env.MY_AWS_REGION});
const snsClient = new SNSClient({ region: process.env.MY_AWS_REGION });

export const createBooking = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const body = JSON.parse(event.body || "{}");
    const bookingId = ulid();
    const bookingsTableName = process.env.BOOKINGS_TABLE_NAME;
    const roomsTableName = process.env.ROOMS_TABLE_NAME;

    const authContext = event.requestContext?.authorizer?.lambda;
    const userId = authContext?.userId;
    const userEmail = authContext?.email;

    if (!userId || !userEmail) {
      return createHTTPResponse(
        { response: [], error: ["Unauthorized - Missing user information"] },
        401
      );
    }

    if (!body.roomId || !body.startDate || !body.endDate || !body.daysBooked) {
      return createHTTPResponse({response: [], error: ["Missing required fields: roomId, startDate, endDate, daysBooked"]}, 400);
    }

    //get room to verify availability
    const roomResult = await dynamoDbClient.send(
      new GetItemCommand({
        TableName: roomsTableName,
        Key: { roomId: { S: body.roomId } },
      })
    );

    const room = unmarshall(roomResult.Item);

    if (!room.isAvailable) {
      return createHTTPResponse({ response: [], error: ["Room is not available"] }, 400);
    }

    const amount = room.pricePerNight * body.daysBooked;

    const bookingParams = {
      TableName: bookingsTableName,
      Item: marshall({
        bookingId,
        roomId: body.roomId,
        userId,
        userEmail,
        startDate: body.startDate,
        endDate: body.endDate,
        daysBooked: body.daysBooked,
        state: "pending",
        amount
      }),
    };
    await dynamoDbClient.send(new PutItemCommand(bookingParams));

    //you cand send notification to user and not wait if is sended or not

    //this publish a message to SNS, this message is to payment and will be listened by payments lambda
    await snsClient.send(new PublishCommand({
      TopicArn: process.env.BOOKING_TOPIC_ARN,
      Message: JSON.stringify({
        bookingId,
        userEmail,
        amount,
        roomId: body.roomId
      }),
      MessageAttributes: { // Filter for SQS
        eventType: {
          DataType: 'String',
          StringValue: 'PAYMENT_PROCESSING'
        }
      }
    }));

    const bodyResponse = {
      response: [{
        message: "Booking created successfully with state pending.",
        bookingId
      }],
      error: []
    };

    return createHTTPResponse(bodyResponse, 201);
  } catch (error) {
     return createHTTPResponse({response:[], error: [error.message]}, 500);
  }
};

