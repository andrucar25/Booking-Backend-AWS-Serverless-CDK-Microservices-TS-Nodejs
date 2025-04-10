import { Response } from "../interfaces/response.interface";

export const createHTTPResponse = (
  body: any,
  statusCode: number,
  headers?: { [header: string]: string }
): Response => {
  return {
    statusCode,
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  };
};
