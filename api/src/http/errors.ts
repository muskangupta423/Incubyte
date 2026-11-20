import type { ApiErrorDetail } from '@acme/shared';

/** An error that is safe to show to the client, with the HTTP status to respond with. */
export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly details?: ApiErrorDetail[],
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export class ValidationError extends HttpError {
  constructor(details: ApiErrorDetail[]) {
    super(400, 'Some of the values you sent are not valid.', details);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends HttpError {
  constructor(message: string) {
    super(404, message);
    this.name = 'NotFoundError';
  }
}
