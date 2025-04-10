import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { PutItemCommand, DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { ulid } from "../../../layers/utils/nodejs/node_modules/ulidx";
import { createHTTPResponse } from "../../../layers/utils/nodejs/utils/httpResponse";

const dynamoDbClient = new DynamoDBClient({region: process.env.MY_AWS_REGION});

export const createUser = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const body = JSON.parse(event.body || "{}");
    const userId = ulid();
    const tableName = process.env.USERS_TABLE_NAME;

    const params = {
      TableName: tableName,
      Item: {
        userId: { S: userId },
        fullname: { S: body.fullname },
        email: { S: body.email },
        password: { S: body.password },
        phone: { S: body.phone },
        createdAt: { S: new Date().toISOString() },
      },
    };
    await dynamoDbClient.send(new PutItemCommand(params));

    const bodyResponse = {
      response: [{
        message: "User created successfully.",
        userId
      }],
      error: []
    };

    return createHTTPResponse(bodyResponse, 201);
  } catch (error) {
     return createHTTPResponse({response:[], error: [error.message]}, 500);
  }
};

