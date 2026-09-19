import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from '@nestjs/common';
import { BaseExceptionFilter, HttpAdapterHost } from '@nestjs/core';

@Catch()
export class UploadsExceptionFilter extends BaseExceptionFilter implements ExceptionFilter {
  constructor(adapter: HttpAdapterHost) { super(adapter.httpAdapter); }

  catch(exception: unknown, host: ArgumentsHost) {
    const http = host.switchToHttp();
    const path = http.getRequest().path as string;
    if (path === '/uploads' || path?.startsWith('/uploads/')) {
      const status = exception instanceof HttpException ? exception.getStatus() : 500;
      http.getResponse().status(status).json({ statusCode: status, message: status === 404 ? '文件不存在' : '文件暂时无法访问' });
      return;
    }
    super.catch(exception, host);
  }
}
