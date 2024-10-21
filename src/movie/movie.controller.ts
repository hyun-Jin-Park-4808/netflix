import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { MovieService } from './movie.service';

@Controller('movie')
export class MovieController {
  constructor(private readonly movieService: MovieService) {}
  // 사용하고 싶은 의존성을 정의만 해주면 nestJS에서 알아서 의존성 주입을 해준다. 

  @Get()
  getMovies(
    @Query('title') title?: string,
  ) {
    return this.movieService.getManyMovies();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.movieService.getMovieById(+id);
  }

  @Post()
  create(@Body('title') title: string) {
    return this.movieService.createMovie(title);
  }

  @Patch(':id')
  update(
    @Param('id') id: string, 
    @Body('title') title: string) {
    return this.movieService.updateMovie(+id, title);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.movieService.deleteMovie(+id);
  }
}
