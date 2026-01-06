import {
  BadRequestException,
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Request,
  UseInterceptors,
} from '@nestjs/common';
import { Public } from 'src/auth/decorator/public.decorator';
import { RBAC } from 'src/auth/decorator/rbac.decorator';
import { TransactionInterceptor } from 'src/common/interceptor/transaction.interceptor';
import { UserId } from 'src/user/decorator/user-id.decorator';
import { Role } from 'src/user/entities/user.entity';
import { CreateMovieDto } from './dto/create-movie.dto';
import { GetMoviesDto } from './dto/get-movies.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { MovieService } from './movie.service';
import { QueryRunner } from 'src/common/decorator/query.runner.decorator';
import { QueryRunner as QR } from 'typeorm';
import { query } from 'express';

@Controller('movie')
@UseInterceptors(ClassSerializerInterceptor) // class transformer를 movie controller에 적용하겠다.
export class MovieController {
  constructor(private readonly movieService: MovieService) {}
  // 사용하고 싶은 의존성을 정의만 해주면 nestJS에서 알아서 의존성 주입을 해준다.

  @Get()
  @Public()
  getMovies(@Query() dto: GetMoviesDto) {
    return this.movieService.findAll(dto);
  }

  @Get(':id')
  @Public()
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
  @RBAC(Role.admin)
  @UseInterceptors(TransactionInterceptor)
  postMovie(
    @Request() req: any,
    @Body() body: CreateMovieDto,
    @QueryRunner() queryRunner: QR,
    @UserId() userId: number,
  ) {
    return this.movieService.create(body, userId, queryRunner);
  }

  @Patch(':id')
  @RBAC(Role.admin)
  patchMovie(
    @Param('id', ParseIntPipe) id: number, // 기본 파이프 적용
    @Body() body: UpdateMovieDto,
  ) {
    return this.movieService.update(id, body);
  }

  @Delete(':id')
  @RBAC(Role.admin)
  deleteMovie(@Param('id', ParseIntPipe) id: number) {
    return this.movieService.remove(id);
  }
}
