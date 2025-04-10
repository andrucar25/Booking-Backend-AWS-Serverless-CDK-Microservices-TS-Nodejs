import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient, QueryCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';

import { createHTTPResponse } from '../../../layers/utils/nodejs/utils/httpResponse';
import { signToken } from '../../../layers/utils/nodejs/utils/jwt';

const dynamoDb = new DynamoDBClient({ region: process.env.MY_AWS_REGION });

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('entra a la lambda')
  try {
    const { email, password } = JSON.parse(event.body || '{}');

    const { Items } = await dynamoDb.send(new QueryCommand({
      TableName: process.env.USERS_TABLE_NAME,
      IndexName: "EmailIndex",
      KeyConditionExpression: "email = :email",
      ExpressionAttributeValues: {
        ":email": { S: email }
      },
      Limit: 1
    }));
    console.log("🚀 ~ Items:", Items)

    if (!Items || Items.length === 0) {
     return createHTTPResponse({response:[], error: ['Invalid credentials'] }, 401);
    }

    const user = unmarshall(Items[0]);
    console.log("🚀 ~ user:", user)

    if (user.password !== password) {
      return createHTTPResponse({ error: ['Wrong Password'] }, 401);
    }

    const token = await signToken({userId: user.userId, email: user.email});

    console.log("🚀 ~ token:", token)
    const bodyResponse = {
      response: [{accessToken: token}],
      error: []
    };

    return createHTTPResponse(bodyResponse, 200);

  } catch (error) {
    return createHTTPResponse({response:[], error: [error.message]}, 500);
  }
};