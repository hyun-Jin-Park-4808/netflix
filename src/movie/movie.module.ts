import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Movie } from './entity/movie.entity';
import { MovieController } from './movie.controller';
import { MovieService } from './movie.service';
import { MovieDetail } from './entity/movie-detail.entity';
import { Director } from 'src/director/entity/director.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Movie, MovieDetail, Director])],
  controllers: [MovieController],
  providers: [MovieService],
})
export class MovieModule {}
