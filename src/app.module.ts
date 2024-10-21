import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService], 
  // 1. AppService에 @Injectable() 데코레이터를 달아, 해당 클래스를 IoC에서 관리하도록 명시해준다.
  // 2. providers 배열을 통해 IoC가 AppService 인스턴스가 필요함을 인지하고 인스턴스화하고 추출해서 위 컴트롤러에 넣어준다. 
})
export class AppModule {}
