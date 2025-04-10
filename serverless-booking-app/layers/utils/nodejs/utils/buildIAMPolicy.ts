import { APIGatewayAuthorizerResult } from "aws-lambda";

export const buildIAMPolicy = (
  principalId: string,
  effect: string,
  resource: string,
  context?: { [key: string]: any }
): APIGatewayAuthorizerResult => {
  const policy: APIGatewayAuthorizerResult = {
    principalId,
    policyDocument: {
      Version: "2012-10-17",
      Statement: [
        {
          Action: "execute-api:Invoke",
          Effect: effect,
          Resource: resource,
        },
      ],
    },
    context,
  };

  return policy;
};
