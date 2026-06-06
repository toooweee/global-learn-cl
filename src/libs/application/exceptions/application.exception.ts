export class ApplicationException extends Error {
  readonly code: string;
  readonly statusCode: number;

  constructor(
    message: string,
    code = 'APPLICATION_EXCEPTION',
    statusCode = 500,
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
