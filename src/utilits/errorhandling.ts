import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    console.error(exception);

    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let error = 'Internal Server Error';
    let message: string | string[] = 'Internal server error';
    let details: Record<string, unknown> | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else {
        const responseData = exceptionResponse as Record<string, unknown>;
        error = typeof responseData.error === 'string' ? responseData.error : exception.name;
        message = typeof responseData.message === 'string' || Array.isArray(responseData.message)
          ? responseData.message as string | string[]
          : exception.message;

        const extraData = { ...responseData };
        delete extraData.statusCode;
        delete extraData.error;
        delete extraData.message;
        if (Object.keys(extraData).length > 0) {
          details = extraData;
        }
      }
    } else if (exception instanceof QueryFailedError) {
      status = HttpStatus.CONFLICT;
      error = 'Database Error';
      message = exception.message;
      details = {
        code: exception.driverError?.code,
        detail: exception.driverError?.detail,
        table: exception.driverError?.table,
        column: exception.driverError?.column,
        constraint: exception.driverError?.constraint,
      };
    } else if (exception instanceof Error) {
      error = exception.name;
      message = exception.message;
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      error,
      message,
      ...(details ? { details } : {}),
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}