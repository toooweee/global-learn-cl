export class ApplicationException extends Error {
  readonly code: string;
  readonly statusCode: number;

  constructor(
    message: string,
    statusCode = 500,
    code = 'APPLICATION_EXCEPTION',
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
