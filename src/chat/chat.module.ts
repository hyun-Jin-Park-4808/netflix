import { Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';

@Module({
  imports: [AuthModule],
  providers: [ChatGateway, ChatService],
})
export class ChatModule {}
