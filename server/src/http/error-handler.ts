import type { ApiErrorDetail, ApiErrorResponse } from '@acme/shared';
import type { ErrorRequestHandler, RequestHandler, Response } from 'express';
import { HttpError, NotFoundError } from './errors';

/** Any request that reached this point matched no route. */
export const notFoundHandler: RequestHandler = (req) => {
  // baseUrl + path: inside app.use("/api", ...) req.path alone has the "/api" prefix removed.
  throw new NotFoundError(`No API route for ${req.method} ${req.baseUrl}${req.path}`);
};

/**
 * Turns every error into the same JSON shape: { error: { message, details? } }.
 * Unexpected errors are logged in full but the client only gets a generic message,
 * so stack traces and database details never leak.
 */
// Express recognises error handlers by their 4 parameters, so _next must stay.
export const errorHandler: ErrorRequestHandler = (error: unknown, req, res, _next) => {
  if (error instanceof HttpError) {
    sendError(res, error.status, error.message, error.details);
    return;
  }
  if (isMalformedJson(error)) {
    sendError(res, 400, 'Request body is not valid JSON.');
    return;
  }
  if (isTooLarge(error)) {
    sendError(res, 413, 'This is too much data for one request. Please split the file.');
    return;
  }

  console.error(`Unexpected error on ${req.method} ${req.originalUrl}`, error);
  sendError(res, 500, 'Something went wrong. Please try again.');
};

function sendError(res: Response, status: number, message: string, details?: ApiErrorDetail[]) {
  const body: ApiErrorResponse = { error: { message, ...(details && { details }) } };
  res.status(status).json(body);
}

/** express.json() rejects a body over its size limit with status 413. */
function isTooLarge(error: unknown): boolean {
  return error instanceof Error && 'status' in error && error.status === 413;
}

/** express.json() throws a SyntaxError carrying status 400 when the body cannot be parsed. */
function isMalformedJson(error: unknown): boolean {
  return error instanceof SyntaxError && 'status' in error && error.status === 400;
}
