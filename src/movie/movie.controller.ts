import {
  CacheKey,
  CacheTTL,
  CacheInterceptor as CI,
} from '@nestjs/cache-manager';
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
  Req,
  Request,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Public } from 'src/auth/decorator/public.decorator';
import { RBAC } from 'src/auth/decorator/rbac.decorator';
import { QueryRunner } from 'src/common/decorator/query.runner.decorator';
import { Throttle } from 'src/common/decorator/throttle.decorator';
import { TransactionInterceptor } from 'src/common/interceptor/transaction.interceptor';
import { UserId } from 'src/user/decorator/user-id.decorator';
import { QueryRunner as QR } from 'typeorm';
import { CreateMovieDto } from './dto/create-movie.dto';
import { GetMoviesDto } from './dto/get-movies.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { MovieService } from './movie.service';
import { Role } from '@prisma/client';

@Controller({
  path: 'movie',
  // version: VERSION_NEUTRAL, // 버전 없거나 모든 버전에 대해 적용
})
@ApiBearerAuth()
@ApiTags('movie')
// @UseInterceptors(ClassSerializerInterceptor) // class transformer를 movie controller에 적용하겠다.
export class MovieController {
  constructor(private readonly movieService: MovieService) {}
  // 사용하고 싶은 의존성을 정의만 해주면 nestJS에서 알아서 의존성 주입을 해준다.

  @Get()
  @Public()
  @Throttle({ count: 5, unit: 'minute' })
  // @Version(['1', '3', '5']) // 컨트롤러단 버전 정의 오버라이딩됨. 이 api는 버전 1, 3, 5번으로만 호출 가능
  @ApiOperation({
    description: '[Movie]를 Pagination하는 API',
  })
  @ApiResponse({
    status: 200,
    description: '성공 응답',
  })
  @ApiResponse({
    status: 400,
    description: 'pagination 데이터를 잘못 입력했을 때 응답',
  })
  getMovies(@Query() dto: GetMoviesDto, @UserId() userId?: number) {
    return this.movieService.findAll(dto, userId);
  }

  @Get('recent') // :id 위에 선언해야 nestJS해서 라우팅이 제대로 된다. 정적 라우트 -> 동적 라우트 순으로 둬야 한다.
  @UseInterceptors(CI) // 자동으로 엔드포인트의 결과를 캐싱한다. url을 키로 두고 캐싱하기 때문에 파라미터 추가되면 다른 키로 인식해서 새로 캐싱한다.
  @CacheKey('getMoviesRecent') // 캐시 키를 지정하게되면 파라미터 변경되도 ttl 동안 같은 캐싱된 값이 리턴된다.
  @CacheTTL(1000) // 캐싱 ttl 오버라이드 가능하다.
  getMoviesRecent() {
    return this.movieService.findRecent();
  }

  @Get(':id')
  @Public()
  getMovie(
    @Param(
      'id',
      // new ParseIntPipe({
      //   exceptionFactory(error) {
      //     throw new BadRequestException(`숫자를 입력해주세요. ${error}`);
      //   },
      // }),
    )
    id: string,
    // @Req() request: any,
  ) {
    // const session = request.session;
    // const movieCount = session.movieCount ?? {};
    // request.session.movieCount = {
    //   ...movieCount,
    //   [id]: (movieCount[id] ?? 0) + 1,
    // };
    // console.log(session);
    // number로 변환 및 검증
    return this.movieService.findOne(id);
  }

  @Post()
  @RBAC(Role.admin)
  // @UseInterceptors(TransactionInterceptor)
  postMovie(
    @Body() body: CreateMovieDto,
    // @QueryRunner() queryRunner: QR,
    @UserId() userId: number,
  ) {
    return this.movieService.create(
      body,
      userId,
      // , queryRunner
    );
  }

  @Patch(':id')
  @RBAC(Role.admin)
  patchMovie(@Param('id') id: string, @Body() body: UpdateMovieDto) {
    return this.movieService.update(id, body);
  }

  @Delete(':id')
  @RBAC(Role.admin)
  deleteMovie(@Param('id') id: string) {
    return this.movieService.remove(id);
  }

  /**
   * [Like] [Dislike]
   *
   * 아무것도 누르지 않은 상태
   * Like & Dislike 모두 버튼 꺼져있음
   *
   * Like 버튼 누르면 Like 버튼 불 켜짐
   * Like 버튼 다시 누르면 Like 버튼 꺼짐
   *
   * Dislike 버튼 누르면 Dislike 버튼 불켜짐
   * Dislike 버튼 다시 누르면 Dislike 버튼 꺼짐
   *
   * Like버튼 누름 -> Dislike 버튼 불 꺼지고 Like 버튼 불 켜짐
   * Dislike버튼 누름 -> Like 버튼 불 꺼지고 Dislike 버튼 불 켜짐
   */
  @Post(':id/like')
  createMovieLike(@Param('id') id: string, @UserId() userId: number) {
    return this.movieService.toggleMovieLike(id, userId, true);
  }

  @Post(':id/dislike')
  createMovieDislike(@Param('id') id: string, @UserId() userId: number) {
    return this.movieService.toggleMovieLike(id, userId, false);
  }
}

// @Controller({
//   path: 'movie',
//   version: '2',
// })
// export class MovieControllerV2 {
//   @Get()
//   getMovies() {
//     return [];
//   }
// }
