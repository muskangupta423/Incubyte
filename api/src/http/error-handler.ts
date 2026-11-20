import type { ApiErrorResponse } from '@acme/shared';
import type { ErrorRequestHandler, RequestHandler } from 'express';
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
    const body: ApiErrorResponse = {
      error: { message: error.message, ...(error.details && { details: error.details }) },
    };
    res.status(error.status).json(body);
    return;
  }

  console.error(`Unexpected error on ${req.method} ${req.originalUrl}`, error);
  const body: ApiErrorResponse = { error: { message: 'Something went wrong. Please try again.' } };
  res.status(500).json(body);
};
