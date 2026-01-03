import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Movie } from './entities/movie.entity';
import { MovieController } from './movie.controller';
import { MovieService } from './movie.service';
import { MovieDetail } from './entities/movie-detail.entity';
import { Director } from 'src/director/entity/director.entity';
import { Genre } from 'src/genre/entities/genre.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Movie, MovieDetail, Director, Genre])],
  controllers: [MovieController],
  providers: [MovieService],
})
export class MovieModule {}
