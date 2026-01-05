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
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { Public } from 'src/auth/decorator/public.decorator';
import { RBAC } from 'src/auth/decorator/rbac.decorator';
import { TransactionInterceptor } from 'src/common/interceptor/transaction.interceptor';
import { Role } from 'src/user/entities/user.entity';
import { createMovieDto } from './dto/create-movie.dto';
import { GetMoviesDto } from './dto/get-movies.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { MovieService } from './movie.service';
import { MovieFilePipe } from './pipe/movie-file.pipe';

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
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        {
          name: 'movie',
          maxCount: 1,
        },
        {
          name: 'poster',
          maxCount: 2,
        },
      ],
      {
        limits: {
          fileSize: 20000000, // 20MB
        },
        fileFilter(req, file, cb) {
          if (file.mimetype !== 'video/mp4') {
            return cb(
              new BadRequestException('mp4 타입만 입력해주세요.'),
              false,
            );
          }
          return cb(null, true); // null 부분에 에러 넣어주면 에러 던지게 된다. true 로 설정하면 파일을 받아볼 수 있고 false로 설정하면 파일 안받는다.
        },
      },
    ),
  )
  // @UseInterceptors(FilesInterceptor('movies')) // 단수일 경우 FileInterceptor
  postMovie(
    @Body() body: createMovieDto,
    @Request() req: any,
    // @UploadedFiles() files: Express.Multer.File[],
    // @UploadedFile(
    //   new MovieFilePipe({
    //     maxSize: 20, // 20MB
    //     mimeTypes: 'video/mp4',
    //   }),
    // ) movie: Express.Multer.File, // 이렇게 파이프로 파일 이름 변경할 수 있지만 모듈에서 파일명 변경하는 코드 넣는 것이 훨씬 간단하고,  
    // 인터셉터 -> 파이프이기 때문에 인터셉터의 필터링 조건과 파이프의 필터링 조건이 다르면 인터셉터에서 통과해 업로드 되고 나서 파이프에서 에러가 발생할 수도 있다.
    // 인터셉터 전에 적용되는 미들웨어 -> 가드 (-> 인터셉터) 에서 파일 업로드를 막아야한다.
    @UploadedFile() movie: Express.Multer.File,
  ) {
    console.log(movie);
    return this.movieService.create(body, req.queryRunner);
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
