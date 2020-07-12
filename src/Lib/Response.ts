export interface IResponse {
  msg?: string;
  status?: number;
  payload: unknown;
}

export class Response {

  static success(payload: unknown): IResponse {
    return {
      msg: 'success',
      status: 200,
      payload,
    };
  }

  static error(payload: unknown): IResponse  {
    return {
      msg: 'error',
      status: 500,
      payload,
    };
  }
}