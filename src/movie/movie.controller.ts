import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseInterceptors, ClassSerializerInterceptor } from '@nestjs/common';
import { MovieService } from './movie.service';
import { createMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';

@Controller('movie')
@UseInterceptors(ClassSerializerInterceptor) // class transformer를 movie controller에 적용하겠다.
export class MovieController {
  constructor(private readonly movieService: MovieService) {}
  // 사용하고 싶은 의존성을 정의만 해주면 nestJS에서 알아서 의존성 주입을 해준다. 

  @Get()
  getMovies(
    @Query('title') title?: string,
  ) {
    return this.movieService.getManyMovies(title);
  }

  @Get(':id')
  getMovie(@Param('id') id: string) {
    return this.movieService.getMovieById(+id);
  }

  @Post()
  postMovie(
    @Body() body: createMovieDto,
  ) {
    return this.movieService.createMovie(body);
  }

  @Post('series')
  postSeries(
    @Body() body: createMovieDto,
  ) {
    return this.movieService.createSeries(body);
  }

  @Patch(':id')
  patchMovie(
    @Param('id') id: string, 
    @Body() body: UpdateMovieDto,
  ) {
    return this.movieService.updateMovie(+id, body);
  }

  @Delete(':id')
  deleteMovie(@Param('id') id: string) {
    return this.movieService.deleteMovie(+id);
  }
}
