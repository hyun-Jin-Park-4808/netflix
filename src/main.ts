import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { AppModule } from './app.module';
import * as ffmpeg from '@ffmpeg-installer/ffmpeg';
import * as ffmpegFluent from 'fluent-ffmpeg';
import * as ffprobe from 'ffprobe-static';

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
  await app.listen(process.env.PORT || 3000);
}
bootstrap();
