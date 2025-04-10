export interface Response {
  statusCode: number;
  body: string;
  headers?: {
    [header: string]: string;
  };
}
