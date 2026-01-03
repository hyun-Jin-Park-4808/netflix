import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Public } from '../decorator/public.decorator';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}
  canActivate(context: ExecutionContext): boolean {
    // 만약에 public decoration이 돼있으면 모든 로직을 bypass한다.
    const isPublic = this.reflector.get(Public, context.getHandler()); // Public decorator에 입력된 객체가 들어온다. @Public('test') 면 isPublic = 'test'가 된다.

    if (isPublic) {
      // 데코레이터만 있으면 isPublic = {} 가 되어 true를 리턴하고, 데코레이터 없으면 undefined가 되어 false를 리턴한다.
      return true;
    }

    // 요청에서 user 객체가 있는지 확인한다.
    const request = context.switchToHttp().getRequest();

    if (!request.user || request.user.type !== 'access') {
      return false;
    }

    return true;
  }
}
