export class DomainException extends Error {
  readonly code: string;
  readonly statusCode: number;

  constructor(
    message: string,
    code = 'DOMAIN_VALIDATION_ERROR',
    statusCode = 400,
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
