import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { create } from "domain";

export const Authorization = createParamDecorator(
  (data: string, context: ExecutionContext) => {
    const req = context.switchToHttp().getRequest();
    return req.headers["authorization"];
  }
)