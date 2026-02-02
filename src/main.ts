import * as ffmpeg from '@ffmpeg-installer/ffmpeg';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as session from 'express-session';
import * as ffprobe from 'ffprobe-static';
import * as ffmpegFluent from 'fluent-ffmpeg';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { AppModule } from './app.module';

ffmpegFluent.setFfmpegPath(ffmpeg.path);
ffmpegFluent.setFfprobePath(ffprobe.path);

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['verbose'], // verbose 이상의 로그만 보인다.
  });
  const config = new DocumentBuilder()
    .setTitle('Netflix API')
    .setDescription('Netflix NestJS 강의')
    .setVersion('1.0')
    .addBasicAuth()
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('doc', app, document, {
    swaggerOptions: {
      persistAuthorization: true, // 스웨거 새로고침해도 기억하게 하는 옵션
    },
  });

  // app.enableVersioning({
  // type: VersioningType.URI,
  // defaultVersion: ['1', '2'], // 기본 버전 배열로도 설정 가능
  // type: VersioningType.HEADER,
  // header: 'version',
  // type: VersioningType.MEDIA_TYPE,
  // key: 'v=',
  // });
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

  // 세션 미들웨어 등록, 서버에서 사용자별 상태를 저장할 수 있게 해준다.
  // 세션 id를 서버에서 Set-Cookie 헤더에 담아 브라우저에 보낼 때, secret에 넣은 비밀키를 사용해 서명을 한다.
  // 브라우저에서는 connect.sid 라는 쿠키를 저장한다.
  // 서명을 통해 브라우저가 쿠키를 임의로 조작했는지 확인하고, 조작됐다면 서버가 이를 감지하고 무시한다.
  app.use(
    session({
      secret: 'my-secret-key',
    }),
  );

  await app.listen(process.env.PORT || 3000);
}
bootstrap();
