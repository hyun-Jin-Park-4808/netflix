import { Chat } from './chat.schema';
import { User } from 'src/user/schema/user.schema';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({
  timestamps: true,
})
export class ChatRoom extends Document {
  @Prop({
    type: [
      {
        type: Types.ObjectId,
        ref: 'Chat',
      },
    ],
  })
  chats: Chat[];

  @Prop({
    type: [
      {
        type: Types.ObjectId,
        ref: 'User',
      },
    ],
  })
  users: User[];
}

export const ChatRoomSchema = SchemaFactory.createForClass(ChatRoom);
