import { BaseError, httpStatusCode } from './Types';

export class BadRequestError extends BaseError {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  errors: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(message: string, errors?: any[]) {
    super(message);
    this.name = this.constructor.name;
    this.status = httpStatusCode.BAD_REQUEST;
    Error.captureStackTrace(this, this.constructor);
    // Saving custom property.
    this.message = message;
    this.errors = errors;
  }
}

// tslint:disable-next-line: max-classes-per-file
export class ValidationError extends BaseError {
  constructor(message: string) {
    super('Validation exception');
    this.name = this.constructor.name;
    this.status = httpStatusCode.BAD_REQUEST;
    Error.captureStackTrace(this, this.constructor);
    // Saving custom property.
    this.message = message;
  }
}

// tslint:disable-next-line: max-classes-per-file
export class RecordNotFoundError extends BaseError {
  constructor(message: string) {
    super('Record Not Found');
    this.name = this.constructor.name;
    this.status = httpStatusCode.NOT_FOUND;
    Error.captureStackTrace(this, this.constructor);
    // Saving custom property.
    this.message = message;
  }
}

// tslint:disable-next-line: max-classes-per-file
export class PaymentGatewayError extends BaseError {
  constructor(message: string, coreException = null, statusCode = null) {
    super('Payment gateway error');
    this.name = this.constructor.name;
    this.status = statusCode || httpStatusCode.BAD_GATEWAY;
    Error.captureStackTrace(this, this.constructor);
    // Saving custom property.
    this.message = message;
    this.coreException = coreException;
  }
}

// tslint:disable-next-line: max-classes-per-file
export class UnauthorizedError extends BaseError {
  constructor(message: string) {
    super('Unauthorized exception');
    this.name = this.constructor.name;
    this.status = httpStatusCode.UNAUTHORIZED;
    Error.captureStackTrace(this, this.constructor);
    // Saving custom property.
    this.message = message;
  }
}

// tslint:disable-next-line: max-classes-per-file
export class RequestTimedOutError extends BaseError {
  constructor(message: string) {
    super('Gateway Timeout');
    this.name = this.constructor.name;
    this.status = httpStatusCode.GATEWAY_TIMEOUT;
    Error.captureStackTrace(this, this.constructor);
    // Saving custom property.
    this.message = message;
  }
}

// tslint:disable-next-line: max-classes-per-file
export class RequestEntityTooLargeError extends BaseError {
  constructor(message: string) {
    super('Request entity too large');
    this.name = this.constructor.name;
    this.status = httpStatusCode.REQ_ENTITY_TOO_LARGE;
    Error.captureStackTrace(this, this.constructor);
    // Saving custom property.
    this.message = message;
  }
}
// tslint:disable-next-line: max-classes-per-file
export class ForbiddenError extends BaseError {
  constructor(message: string) {
    super('Access Forbidden');
    this.name = this.constructor.name;
    this.status = httpStatusCode.FORBIDDEN;
    Error.captureStackTrace(this, this.constructor);
    // Saving custom property.
    this.message = message;
  }
}
// tslint:disable-next-line: max-classes-per-file
export class IntegrationGatewayError extends BaseError {
  constructor(message: string, coreException: Error, statusCode = null) {
    super('Integration gateway error');
    this.name = this.constructor.name;
    this.status = statusCode ? statusCode : httpStatusCode.BAD_GATEWAY;
    Error.captureStackTrace(this, this.constructor);
    // Saving custom property.
    this.message = message;
    this.coreException = coreException;
  }
}
// tslint:disable-next-line: max-classes-per-file
export class ConflictError extends BaseError {
  constructor(message: string) {
    super('Conflict error');
    this.name = this.constructor.name;
    this.status = httpStatusCode.CONFLICT;
    Error.captureStackTrace(this, this.constructor);
    // Saving custom property.
    this.message = message;
  }
}
// tslint:disable-next-line: max-classes-per-file
export class InternalServerError extends BaseError {
  constructor(message: string, coreException: Error) {
    super('Internal Server Error');
    this.name = this.constructor.name;
    this.status = httpStatusCode.INTERNAL_SERVER_ERROR;
    Error.captureStackTrace(this, this.constructor);
    // Saving custom property.
    this.coreException = coreException;
    this.message = message;
  }
}
