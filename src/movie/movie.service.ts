import { Injectable, NotFoundException } from '@nestjs/common';
import { createMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { Movie, Series } from './entity/movie.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';

@Injectable() // IoC에서 AppService를 인스턴스화해서 다른 클래스에 알아서 주입할 수 있도록 관리하게 된다.
export class MovieService {
  constructor(
    @InjectRepository(Movie)
    private readonly movieRepository: Repository<Movie>,
    @InjectRepository(Series)
    private readonly seriesRepository: Repository<Series>
  ) {}

  async getManyMovies(title?: string) {
    if (!title) {
      return [await this.movieRepository.find(), await this.movieRepository.count()];
    }
    return this.movieRepository.findAndCount({
      where: {
        title: Like(`%${title}%`),
      },
    })
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
    const movie = await this.movieRepository.save({
      ...createMovieDto,
      runtime: 100,
    });
    return movie;
  }

    async createSeries(createSeriesMovieDto: createMovieDto) {
    const movie = await this.seriesRepository.save({
      ...createSeriesMovieDto,
      seriesCount: 16,
    });
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
