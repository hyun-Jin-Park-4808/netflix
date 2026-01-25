import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ServeStaticModule } from '@nestjs/serve-static';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as Joi from 'joi';
import { WinstonModule } from 'nest-winston';
import { join } from 'path';
import * as winston from 'winston';
import { AuthModule } from './auth/auth.module';
import { AuthGuard } from './auth/guard/auth.guard';
import { RBACGuard } from './auth/guard/rbac.guard';
import { envVarableKeys } from './common/const/env.const';
import { QueryFailedErrorFilter } from './common/filter/query-failed.filter';
import { ResponseTimeInterceptor } from './common/interceptor/response-time.interceptor';
import { ThrottleInterceptor } from './common/interceptor/throttle.interceptor';
import { DirectorModule } from './director/director.module';
import { Director } from './director/entity/director.entity';
import { Genre } from './genre/entity/genre.entity';
import { GenreModule } from './genre/genre.module';
import { MovieDetail } from './movie/entity/movie-detail.entity';
import { MovieUserLike } from './movie/entity/movie-user-like.entity';
import { Movie } from './movie/entity/movie.entity';
import { MovieModule } from './movie/movie.module';
import { User } from './user/entity/user.entity';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV === 'test' ? 'test.env' : '.env',
      // 환경변수 검증
      validationSchema: Joi.object({
        ENV: Joi.string().valid('dev', 'test', 'prod').required(),
        DB_TYPE: Joi.string().valid('postgres').required(),
        DB_HOST: Joi.string().required(),
        DB_PORT: Joi.number().required(),
        DB_USERNAME: Joi.string().required(),
        DB_PASSWORD: Joi.string().required(),
        DB_DATABASE: Joi.string().required(),
        HASH_ROUNDS: Joi.number().required(),
        ACCESS_TOKEN_SECRET: Joi.string().required(),
        REFRESH_TOKEN_SECRET: Joi.string().required(),
        AWS_ACCESS_KEY_ID: Joi.string().required(),
        AWS_SECRET_ACCESS_KEY: Joi.string().required(),
        AWS_REGION: Joi.string().required(),
        BUCKET_NAME: Joi.string().required(),
      }),
    }),
    TypeOrmModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        type: configService.get<string>(envVarableKeys.dbType) as 'postgres',
        host: configService.get<string>(envVarableKeys.dbHost),
        port: configService.get<number>(envVarableKeys.dbPort),
        username: configService.get<string>(envVarableKeys.dbUsername),
        password: configService.get<string>(envVarableKeys.dbPassword),
        database: configService.get<string>(envVarableKeys.dbDatabase),
        entities: [Movie, MovieDetail, Director, Genre, User, MovieUserLike],
        synchronize:
          configService.get<string>(envVarableKeys.env) === 'prod'
            ? false // 실서버에서는 false
            : true, // 테스트 서버
        ...(configService.get<string>(envVarableKeys.env) === 'prod' && {
          // 환경변수가 prod면 ssl 옵션을 추가한다., A && B: A이 true이면 B를 실행하고, false이면 false를 반환한다.
          ssl: {
            rejectUnauthorized: false,
          },
        }),
      }),
      inject: [ConfigService], // IoC 컨테이너에서 ConfigService를 DI 해줘야한다고 알려주기 위함
    }),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'public'), // 실제 서버 파일 시스템 경로, public 폴더 안의 파일들을 정적으로 제공하겠다.
      serveRoot: '/public/', // 브라우저에서 정적 파일에 접근할 url prefix
    }),
    CacheModule.register({
      ttl: 0, // 캐시 유효 시간
      isGlobal: true, // 전역 캐시 설정
    }),
    ScheduleModule.forRoot(),
    WinstonModule.forRoot({
      level: 'debug',
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            // 다양한 형태로 콘솔 로그 포맷 지정 가능
            winston.format.colorize({
              all: true, // 모든 로그를 색상 지정
            }),
            winston.format.timestamp(), // 로그 시간 표시
            winston.format.printf(
              // 로그 포맷 지정
              (info) =>
                `${info.timestamp} [${info.context}] ${info.level} ${info.message}`,
            ),
          ),
        }),
        new winston.transports.File({
          // 로그 파일 저장 설정
          dirname: join(process.cwd(), 'logs'), // 로그 파일 저장 경로
          filename: 'logs.log', // 로그 파일 이름
          format: winston.format.combine(
            // 로그 파일에 저장될 로그 포맷 지정
            winston.format.timestamp(),
            winston.format.printf(
              (info) =>
                `${info.timestamp} [${info.context}] ${info.level} ${info.message}`,
            ),
          ),
        }),
      ],
    }),
    MovieModule,
    DirectorModule,
    GenreModule,
    AuthModule,
    UserModule,
  ], // 다른 모듈을 이 모듈로 불러들일 때 사용, nest g로 생성한 모듈은 자동 주입 된다.
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RBACGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseTimeInterceptor,
    },
    // {
    //   provide: APP_FILTER,
    //   useClass: ForbiddenExceptionFilter,
    // },
    {
      provide: APP_FILTER,
      useClass: QueryFailedErrorFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ThrottleInterceptor,
    },
  ],
})
export class AppModule {}
