import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Unhandled server error:', err);
  
  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || 'An unexpected error occurred on the server.';
  
  return res.status(statusCode).json({
    message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};
