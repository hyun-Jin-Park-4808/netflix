import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseInterceptors,
  ClassSerializerInterceptor,
  ParseIntPipe,
  BadRequestException,
} from '@nestjs/common';
import { MovieService } from './movie.service';
import { createMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { MovieTitleValidationPipe } from './pipe/movie-title-validation.pipe';

@Controller('movie')
@UseInterceptors(ClassSerializerInterceptor) // class transformer를 movie controller에 적용하겠다.
export class MovieController {
  constructor(private readonly movieService: MovieService) {}
  // 사용하고 싶은 의존성을 정의만 해주면 nestJS에서 알아서 의존성 주입을 해준다.

  @Get()
  getMovies(@Query('title', MovieTitleValidationPipe) title?: string) {
    return this.movieService.findAll(title);
  }

  @Get(':id')
  getMovie(
    @Param(
      'id',
      new ParseIntPipe({
        exceptionFactory(error) {
          throw new BadRequestException(`숫자를 입력해주세요. ${error}`);
        },
      }),
    )
    id: number,
  ) {
    // number로 변환 및 검증
    return this.movieService.findOne(id);
  }

  @Post()
  postMovie(@Body() body: createMovieDto) {
    return this.movieService.create(body);
  }

  @Patch(':id')
  patchMovie(
    @Param('id', ParseIntPipe) id: number, // 기본 파이프 적용
    @Body() body: UpdateMovieDto,
  ) {
    return this.movieService.update(id, body);
  }

  @Delete(':id')
  deleteMovie(@Param('id', ParseIntPipe) id: number) {
    return this.movieService.remove(id);
  }
}
