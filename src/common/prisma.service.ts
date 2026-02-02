import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    super({
      // global하게 배제할 속성 정의 가능하다.
      omit: {
        user: {
          password: true,
        },
      },
    });
  }

  async onModuleInit() {
    await this.$connect();
  }
}
