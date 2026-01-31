import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { Socket } from 'dgram';
import { AuthService } from 'src/auth/auth.service';
import { ChatService } from './chat.service';

@WebSocketGateway()
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    private readonly chatService: ChatService,
    private readonly authService: AuthService,
  ) {}
  handleDisconnect(client: any) {
    return;
  }
  async handleConnection(client: any, ...args: any[]) {
    try {
      // Bearer '~~'
      const rawToken = client.handshake.headers.authorization;
      const payload = await this.authService.parseBearerToken(rawToken, false);
      if (payload) {
        client.data.user = payload;
      } else {
        client.disconnect();
      }
    } catch (e) {
      console.log(e);
      client.disconnect();
    }
  }

  @SubscribeMessage('receiveMessage')
  async receiveMessage(
    @MessageBody() data: { message: string }, // 받은 데이터의 정보
    @ConnectedSocket() client: Socket, // 연결된 클라이언트의 정보
  ) {
    console.log(data);
    console.log(client);
  }

  @SubscribeMessage('sendMessage') // 우리가 리스닝하고 있는 이벤트 이름
  async sendMessage(
    @MessageBody() data: { message: string }, // 보낼 데이터의 정보
    @ConnectedSocket() client: Socket, // 연결된 클라이언트의 정보
  ) {
    client.emit('sendMessage', {
      // sendMessage: 상대가 리스닝하고 있는 이벤트 이름
      ...data,
      from: 'server',
    });
    console.log(data);
    console.log(client);
  }
}
