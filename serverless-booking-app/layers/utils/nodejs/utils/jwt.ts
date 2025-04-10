import * as jwt from 'jsonwebtoken';
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';
import { JwtPayload } from '../interfaces/jwt.interface';

const ssmClient = new SSMClient({ region: process.env.MY_AWS_REGION });

export const verifyToken = async <T = JwtPayload>(token: string): Promise<T> => {
  const secret = await getParameterFromSSM(process.env.JWT_SECRET_SSM_PARAM);
  if (!process.env.JWT_SECRET_SSM_PARAM) {
    throw new Error('JWT_SECRET_SSM_PARAM is not defined');
  }

  
  return new Promise((resolve, reject) => {
    jwt.verify(token, secret, (err, decoded) => {
      if (err || !decoded) return reject(err || new Error('Invalid token'));
      resolve(decoded as T);
    });
  });
};

export const signToken = async (payload: JwtPayload): Promise<string> => {
  if (!process.env.JWT_SECRET_SSM_PARAM) {
    throw new Error('JWT_SECRET_SSM_PARAM is not defined');
  }

  const secret = await getParameterFromSSM(process.env.JWT_SECRET_SSM_PARAM);
  const expiresIn = '7d';

  return new Promise((resolve, reject) => {
    jwt.sign(payload, secret, { expiresIn }, (err, token) => {
        if (err || !token) return reject(err || new Error('Token generation failed'));
        resolve(token);
      }
    );
  });
};

const getParameterFromSSM = async (paramName: string): Promise<string> => {
  const result = await ssmClient.send(
    new GetParameterCommand({
      Name: paramName,
      WithDecryption: true,
    })
  );
  return result.Parameter?.Value || '';
};