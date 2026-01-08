import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from 'src/common/common.module';
import { Director } from 'src/director/entity/director.entity';
import { Genre } from 'src/genre/entity/genre.entity';
import { User } from 'src/user/entity/user.entity';
import { MovieDetail } from './entity/movie-detail.entity';
import { MovieUserLike } from './entity/movie-user-like.entity';
import { Movie } from './entity/movie.entity';
import { MovieController } from './movie.controller';
import { MovieService } from './movie.service';
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Movie,
      MovieDetail,
      Director,
      Genre,
      MovieUserLike,
      User,
    ]),
    CommonModule,
    CacheModule.register({
      tt: 3000, // 캐시 유효 시간
    }),
    // MulterModule.register({
    //   storage: diskStorage({
    //     // diskStorage: 로컬 저장소에 저장하겠다.
    //     destination: join(process.cwd(), 'public', 'movie'), // 저장할 위치, join으로 쓰면 운영체제 따라 올바른 path로 변경된다.
    //     filename: (req, file, cb) => {
    //       const split = file.originalname.split('.');
    //       let extention = 'mp4';

    //       if (split.length > 1) {
    //         extention = split[split.length - 1];
    //       }
    //       cb(null, `${v4()}_${Date.now()}.${extention}`);
    //     },
    //   }),
    // }),
  ],
  controllers: [MovieController],
  providers: [MovieService],
})
export class MovieModule {}
