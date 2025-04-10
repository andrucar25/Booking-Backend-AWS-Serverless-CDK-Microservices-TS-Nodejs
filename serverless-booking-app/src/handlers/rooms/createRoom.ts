import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { PutItemCommand, DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { ulid } from "../../../layers/utils/nodejs/node_modules/ulidx";
import { createHTTPResponse } from '../../../layers/utils/nodejs/utils/httpResponse';
import { RoomType } from "./enums/roomType.enum";

const dynamoDbClient = new DynamoDBClient({region: process.env.MY_AWS_REGION});

export const createRoom = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const body = JSON.parse(event.body || "{}");
    const roomId = ulid();
    const tableName = process.env.ROOMS_TABLE_NAME;

    if (!body.name || !body.typeRoom || !body.pricePerNight || !body.amenities) {
      return createHTTPResponse(
        {response: [], error: ["Missing required fields: name, type, pricePerNight, amenities, isAvailable"]},
        400
      );
    }

    //validate typeRoom
    if (!Object.values(RoomType).includes(body.typeRoom)) {
      return createHTTPResponse(
        {response: [], error: [`Invalid room typeRoom. Must be one of: ${Object.values(RoomType).join(', ')}`]},
        400
      );
    }

    const params = {
      TableName: tableName,
      Item: {
        roomId: { S: roomId },
        name: { S: body.name },
        typeRoom: { S: body.typeRoom },
        pricePerNight: { N: String(body.pricePerNight) },
        isAvailable: { BOOL: body.isAvailable },
        amenities: { SS: body.amenities } 
      },
    };
    await dynamoDbClient.send(new PutItemCommand(params));

    const bodyResponse = {
      response: [{
        message: "Room created successfully.",
        roomId
      }],
      error: []
    };

    return createHTTPResponse(bodyResponse, 201);
  } catch (error) {
     return createHTTPResponse({response:[], error: [error.message]}, 500);
  }
};

