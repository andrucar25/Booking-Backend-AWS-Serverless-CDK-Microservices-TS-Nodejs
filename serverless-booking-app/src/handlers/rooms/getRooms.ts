import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { QueryCommand, ScanCommand, DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import { createHTTPResponse } from "../../../layers/utils/nodejs/utils/httpResponse";

const dynamoDbClient = new DynamoDBClient({region: process.env.MY_AWS_REGION});

export const getRooms = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const tableName = process.env.ROOMS_TABLE_NAME;
  const typeRoom = event.queryStringParameters?.typeRoom;

  try {
    if(typeRoom) {
      const queryParams = {
        TableName: tableName,
        IndexName: 'TypeIndex',
        KeyConditionExpression: 'typeRoom = :typeRoom',
        FilterExpression: 'isAvailable = :isAvailable',
        ExpressionAttributeValues: {
          ':typeRoom': { S: typeRoom },
          ':isAvailable': { BOOL: true }
        }
      };

      const queryResult = await dynamoDbClient.send(new QueryCommand(queryParams));
      const rooms = queryResult.Items ? queryResult.Items.map(item => unmarshall(item)) : [];

      return createHTTPResponse({ response: rooms, error: [] }, 200);
  }

  const scanParams = {
    TableName: tableName,
    FilterExpression: 'isAvailable = :isAvailable',
    ExpressionAttributeValues: {
      ':isAvailable': { BOOL: true }
    }
  };

  const scanResult = await dynamoDbClient.send(new ScanCommand(scanParams));
  const allRooms = scanResult.Items ? scanResult.Items.map(item => unmarshall(item)) : [];

  return createHTTPResponse({ response: allRooms, error: [] }, 200);


  } catch (error) {
    
    return createHTTPResponse({response:[], error: [error.message]}, 500);
    
  }
};
