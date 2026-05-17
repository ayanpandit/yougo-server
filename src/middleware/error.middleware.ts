import { Context } from 'hono';
import { AppError } from '../utils/errors';
import { ZodError } from 'zod';

export const errorHandler = async (err: Error, c: Context) => {
  console.error('[Error Middleware]:', err);

  if (err instanceof AppError) {
    return c.json(
      {
        status: 'error',
        message: err.message
      },
      // @ts-expect-error Hono context status typings are restrictive, cast as any if necessary, but this works
      err.statusCode
    );
  }

  if (err instanceof ZodError) {
    return c.json(
      {
        status: 'fail',
        message: 'Validation failed',
        errors: err.errors
      },
      400
    );
  }

  return c.json(
    {
      status: 'error',
      message: 'Internal Server Error'
    },
    500
  );
};

export const notFoundHandler = (c: Context) => {
  return c.json(
    {
      status: 'fail',
      message: `Cannot find ${c.req.url} on this server`
    },
    404
  );
};
