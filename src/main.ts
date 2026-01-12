import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['verbose'], // verbose 이상의 로그만 보인다.
  });
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // dto에서 정의하지 않는 속성은 들어갈 수 없게 해준다. 에러는 발생 x, 기본은 false
      forbidNonWhitelisted: true, // whitelist 걸렸을 때 에러 발생시킨다.
      transformOptions: {
        enableImplicitConversion: true, // 쿼리, 바디 등 dto의 필드 타입을 지정된 타입으로 알아서 변환해준다.
      },
    }),
  );
  await app.listen(3000);
}
bootstrap();
