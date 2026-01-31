import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { catchError, concatMap, from, map, Observable, throwError } from 'rxjs';
import { DataSource } from 'typeorm';

@Injectable()
export class WsTransactionInterceptor implements NestInterceptor {
  constructor(private readonly dataSource: DataSource) {}
  async intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Promise<Observable<any>> {
    const client = context.switchToWs().getClient();

    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    client.data.queryRunner = qr;

    return next.handle().pipe(
      catchError((error) => {
        console.error(
          '[WsTransactionInterceptor] Error caught, rolling back:',
          error,
        );
        return from(qr.rollbackTransaction()).pipe(
          concatMap(() => qr.release()),
          concatMap(() => throwError(() => error)),
        );
      }),
      concatMap((data) => {
        return from(qr.commitTransaction()).pipe(
          concatMap(() => qr.release()),
          map(() => data),
        );
      }),
    );
  }
}
