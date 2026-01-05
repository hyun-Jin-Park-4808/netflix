import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Movie } from './entities/movie.entity';
import { MovieController } from './movie.controller';
import { MovieService } from './movie.service';
import { MovieDetail } from './entities/movie-detail.entity';
import { Director } from 'src/director/entity/director.entity';
import { Genre } from 'src/genre/entities/genre.entity';
import { CommonModule } from 'src/common/common.module';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { join } from 'path';
import { v4 } from 'uuid';
@Module({
  imports: [
    TypeOrmModule.forFeature([Movie, MovieDetail, Director, Genre]),
    CommonModule,
    MulterModule.register({
      storage: diskStorage({
        // diskStorage: 로컬 저장소에 저장하겠다.
        destination: join(process.cwd(), 'public', 'movie'), // 저장할 위치, join으로 쓰면 운영체제 따라 올바른 path로 변경된다.
        filename: (req, file, cb) => {
          const split = file.originalname.split('.');
          let extention = 'mp4';

          if (split.length > 1) {
            extention = split[split.length - 1];
          }
          cb(null, `${v4()}_${Date.now()}.${extention}`);
        },
      }),
    }),
  ],
  controllers: [MovieController],
  providers: [MovieService],
})
export class MovieModule {}
