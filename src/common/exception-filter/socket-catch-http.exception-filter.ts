import { ArgumentsHost, Catch } from '@nestjs/common';
import { BaseWsExceptionFilter } from '@nestjs/websockets';

@Catch()
export class SocketCatchHttpExceptionFilter extends BaseWsExceptionFilter {
  catch(exception: any, host: ArgumentsHost): void {
    const client = host.switchToWs().getClient();

    console.log(
      '[SocketCatchHttpExceptionFilter] Exception caught:',
      exception,
    );

    // 기본 동작인 'exception' 이벤트 발생
    super.catch(exception, host);

    // 포스트맨 등에서 확인하기 쉽도록 커스텀 'error' 이벤트도 추가로 발송 (필요시)
    client.emit('error', {
      message: exception.message || 'Unknown Error',
      name: exception.name,
    });
  }
}
