import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // dto에서 정의하지 않는 속성은 들어갈 수 없게 해준다. 에러는 발생 x, 기본은 false
    forbidNonWhitelisted: true, // whitelist 걸렸을 때 에러 발생시킨다. 
  }));
  await app.listen(3000);
}
bootstrap();
