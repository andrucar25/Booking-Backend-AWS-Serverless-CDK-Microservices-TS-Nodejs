import { APIGatewayRequestAuthorizerEvent } from "aws-lambda";

export const buildARN = (
  event: APIGatewayRequestAuthorizerEvent
): string => {
  const region = process.env.MY_AWS_REGION;
  const accountId = event.requestContext.accountId || "";
  const apiId = event.requestContext.apiId || "";
  const stage = event.requestContext.stage || "";
  const method = event.requestContext.http?.method || "";
  const path = event.requestContext.http?.path || "";
  const constructedArn = `arn:aws:execute-api:${region}:${accountId}:${apiId}/${stage}/${method}${path}`;

  return event.requestContext.routeArn || constructedArn;
};
