import { Injectable, NotFoundException } from '@nestjs/common';
import { createMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { Movie } from './entity/movie.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable() // IoC에서 AppService를 인스턴스화해서 다른 클래스에 알아서 주입할 수 있도록 관리하게 된다.
export class MovieService {
  constructor(
    @InjectRepository(Movie)
    private readonly movieRepository: Repository<Movie>
  ) {}

  getManyMovies(title?: string) {
    // TODO: 나중에 타이틀 필터 기능 추가하기
    return this.movieRepository.find();
    // if (!title) {
    //   return this.movies;
    // }
    // return this.movies.filter((m) => m.title.startsWith(title));
  }

  async getMovieById(id: number) {
    const movie = this.movieRepository.findOne({
      where: { id },
    });

    if (!movie) {
      throw new NotFoundException('존재하지 않는 영화입니다.');
    }
    return movie;
  }

  async createMovie(createMovieDto: createMovieDto) {
    const movie = await this.movieRepository.save(createMovieDto);
    return movie;
  }

  async updateMovie(id: number, updateMovieDto: UpdateMovieDto) {
    const movie = await this.movieRepository.findOne({
      where: { id },
    });
    if (!movie) {
      throw new NotFoundException('존재하지 않는 ID의 영화입니다');
    }
    await this.movieRepository.update({id}, updateMovieDto); // 얘는 다른  where 조건 추가 가능 
    // await this.movieRepository.update(id, updateMovieDto); 랑 같음

    const newMovie = await this.movieRepository.findOne({
      where: { id },
    });

    return newMovie;
  }

  async deleteMovie(id: number) {
    const movie = await this.movieRepository.findOne({
      where: { id },
    });
    if (!movie) {
      throw new NotFoundException('존재하지 않는 ID의 영화입니다');
    }

    await this.movieRepository.delete(id);

    return id;
  }
}
