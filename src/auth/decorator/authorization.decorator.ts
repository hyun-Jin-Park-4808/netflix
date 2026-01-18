import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const Authorization = createParamDecorator(
  (data: string, context: ExecutionContext) => {
    const req = context.switchToHttp().getRequest();
    return req.headers['authorization'];
  },
);
