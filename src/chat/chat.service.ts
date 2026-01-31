import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { Role, User } from 'src/user/entity/user.entity';
import { QueryRunner, Repository } from 'typeorm';
import { CreateChatDto } from './dto/create-chat.dto';
import { ChatRoom } from './entity/chat-room.entity';
import { Chat } from './entity/chat.entity';

@Injectable()
export class ChatService {
  private readonly connectedClients = new Map<number, Socket>();
  constructor(
    @InjectRepository(ChatRoom)
    private readonly chatRoomRepository: Repository<ChatRoom>,
    @InjectRepository(Chat)
    private readonly chatRepository: Repository<Chat>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  registerClient(userId: number, client: Socket) {
    this.connectedClients.set(userId, client);
  }

  removeClient(userId: number) {
    this.connectedClients.delete(userId);
  }

  getClient(userId: number) {
    return this.connectedClients.get(userId);
  }

  async joinUserRooms(user: { sub: number }, client: Socket) {
    const chatRooms = await this.chatRoomRepository
      .createQueryBuilder('chatRoom')
      .innerJoin('chatRoom.users', 'user', 'user.id = :userId', {
        userId: user.sub,
      })
      .getMany();
    chatRooms.forEach((room) => {
      client.join(room.id.toString()); // client와 room을 연결
    });
  }

  async createMessage(
    payload: { sub: number },
    { message, room }: CreateChatDto,
    qr: QueryRunner,
  ) {
    const user = await this.userRepository.findOneBy({ id: payload.sub });
    const chatRoom = await this.getOrCreateChatRoom(user, qr, room);
    // 채팅 내용 db에 저장
    const msgModel = await qr.manager.save(Chat, {
      author: user,
      message,
      chatRoom,
    });

    const client = this.connectedClients.get(user.id);
    client.to(chatRoom.id.toString()).emit('newMessage', msgModel);
    return message;
  }

  async getOrCreateChatRoom(user: User, qr: QueryRunner, room?: number) {
    if (user.role === Role.admin) {
      if (!room) {
        throw new WsException('어드민은 Room 값을 필수로 제공해야 합니다.');
      }
      return await qr.manager.findOne(ChatRoom, {
        where: {
          id: room,
        },
        relations: ['users'],
      });
    }

    let chatRoom = await qr.manager
      .createQueryBuilder(ChatRoom, 'chatRoom')
      .innerJoin('chatRoom.users', 'user')
      .where('user.id = :userId', { userId: user.id })
      .getOne();

    if (!chatRoom) {
      const adminUser = await qr.manager.findOne(User, {
        where: {
          role: Role.admin,
        },
      });

      chatRoom = await this.chatRoomRepository.save({
        users: [user, adminUser],
      });

      [user.id, adminUser.id].forEach((userId) => {
        const client = this.connectedClients.get(userId);
        if (client) {
          client.emit('roomCreated', chatRoom.id);
          client.join(chatRoom.id.toString());
        }
      });
    }
    return chatRoom;
  }
}
