import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'src/auth/auth.module';
import { User } from 'src/user/entity/user.entity';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { ChatRoom } from './entity/chat-room.entity';
import { Chat } from './entity/chat.entity';

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([ChatRoom, Chat, User])],
  providers: [ChatGateway, ChatService],
})
export class ChatModule {}
