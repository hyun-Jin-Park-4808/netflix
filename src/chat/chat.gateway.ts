import { UseFilters, UseInterceptors } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { AuthService } from 'src/auth/auth.service';
import { WsQueryRunner } from 'src/common/decorator/ws-query.runner.decorator';
import { SocketCatchHttpExceptionFilter } from 'src/common/exception-filter/socket-catch-http.exception-filter';
import { WsTransactionInterceptor } from 'src/common/interceptor/ws-transaction.interceptor';
import { QueryRunner } from 'typeorm';
import { ChatService } from './chat.service';
import { CreateChatDto } from './dto/create-chat.dto';

@WebSocketGateway()
@UseFilters(SocketCatchHttpExceptionFilter)
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    private readonly chatService: ChatService,
    private readonly authService: AuthService,
  ) {}

  handleDisconnect(client: Socket) {
    const user = client.data.user;
    if (user) {
      this.chatService.removeClient(user.sub);
    }
  }

  async handleConnection(client: Socket) {
    try {
      // Bearer '~~'
      const rawToken = client.handshake.headers.authorization;
      const payload = await this.authService.parseBearerToken(rawToken, false);
      if (payload) {
        client.data.user = payload;
        this.chatService.registerClient(payload.sub, client);
        this.chatService.joinUserRooms(payload, client);
      } else {
        client.disconnect();
      }
    } catch (e) {
      console.log(e);
      client.disconnect();
    }
  }

  @SubscribeMessage('sendMessage')
  @UseInterceptors(WsTransactionInterceptor)
  async handleMessage(
    @MessageBody() body: CreateChatDto,
    @ConnectedSocket() client: Socket,
    @WsQueryRunner() qr: QueryRunner,
  ) {
    const payload = client.data.user;
    await this.chatService.createMessage(payload, body, qr);
  }
}
