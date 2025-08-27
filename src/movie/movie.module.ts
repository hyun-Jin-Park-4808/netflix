import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Movie, Series } from './entity/movie.entity';
import { MovieController } from './movie.controller';
import { MovieService } from './movie.service';

@Module({
  imports: [TypeOrmModule.forFeature([Movie, Series])],
  controllers: [MovieController],
  providers: [MovieService],
})
export class MovieModule {}
