import { Injectable, NotFoundException } from '@nestjs/common';
import { createMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { Movie } from './entity/movie.entity';

@Injectable() // IoC에서 AppService를 인스턴스화해서 다른 클래스에 알아서 주입할 수 있도록 관리하게 된다. 
export class MovieService {
  private movies: Movie[] = [];

  private idCounter = 3;

  constructor() {
    const movie1 = new Movie();
    movie1.id = 1;
    movie1.title = '해리포터';
    movie1.genre = 'fantasy';

    const movie2 = new Movie();
    movie2.id = 2;
    movie2.title = '반지의 제왕';
    movie2.genre = 'action';
  }

  getManyMovies(title?: string) {
    if(!title) {
      return this.movies;
    }
    return this.movies.filter(m => m.title.startsWith(title));
  }

  getMovieById(id: number) {
    const movie = this.movies.find((m) => m.id === +id);
    if(!movie) {
      throw new NotFoundException('존재하지 않는 영화입니다.');
    }
    return movie;
  }

  createMovie(createMovieDto: createMovieDto) {
    const movie: Movie = {
      id: this.idCounter++,
      ...createMovieDto,
      description: 'test'
    };
    this.movies.push(
      movie,
    );

    return movie;
  }

  updateMovie(id: number, updateMovieDto: UpdateMovieDto) {
    const movie = this.movies.find(m => m.id === +id);

    if(!movie) {
      throw new NotFoundException('존재하지 않는 ID의 영화입니다');
    }
    Object.assign(movie, updateMovieDto);

    return movie;
  }

  deleteMovie(id: number) {
    const movieIndex = this.movies.findIndex(m => m.id === +id);

    if(movieIndex === -1) {
      throw new NotFoundException('존재하지 않는 ID의 영화입니다');
    }
    this.movies.splice(movieIndex, 1);

    return id;
  }
}
