import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, of, tap } from 'rxjs';

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  private cache = new Map<string, any>();

  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> | Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();

    // GET-/movie
    const key = `${request.method}-${request.path}`;

    if (this.cache.has(key)) {
      // cache에 존재하는 경우 로직 안타고 캐시에 있는 값 바로 반환한다.
      return of(this.cache.get(key)); // of를 쓰면 Observable로 반환하게 된다.
    }

    return next.handle().pipe(tap((response) => this.cache.set(key, response)));
  }
}
