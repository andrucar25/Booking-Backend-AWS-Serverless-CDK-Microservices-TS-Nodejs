import { APIGatewayTokenAuthorizerEvent, APIGatewayAuthorizerResult } from 'aws-lambda';
import { verifyToken } from '../../../layers/utils/nodejs/utils/jwt';
import { buildIAMPolicy } from '../../../layers/utils/nodejs/utils/buildIAMPolicy';
import { buildARN } from '../../../layers/utils/nodejs/utils/buildARN';

export const handler = async (
  event: APIGatewayTokenAuthorizerEvent
): Promise<APIGatewayAuthorizerResult> => {
  const resourceArn = buildARN(event);

  try {
    const authHeader = event.identitySource?.[0] || event.headers?.authorization;
    if (!authHeader) throw new Error('No token provided');

    const token = authHeader.replace(/^Bearer\s+/i, '');
    if (!token) throw new Error('Invalid token format');

    const payload = await verifyToken(token);

    return buildIAMPolicy(payload.userId, 'Allow', resourceArn, {
      userId: payload.userId,
      email: payload.email,
    });

  } catch (error) {
    console.error('Authorizer error:', error);
    return buildIAMPolicy('unauthorized', 'Deny', resourceArn);
  }
};