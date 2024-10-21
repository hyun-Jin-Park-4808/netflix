import { Body, Controller, Delete, Get, NotFoundException, Param, Patch, Post, Query } from '@nestjs/common';
import { AppService } from './app.service';



@Controller('movie')
export class AppController {

  constructor(private readonly appService: AppService) { }
  // 사용하고 싶은 의존성을 정의만 해주면 nestJS에서 알아서 의존성 주입을 해준다. 

  @Get()
  getMovies(
    @Query('title') title?: string,
  ) {
    // title 쿼리의 타입이 string 타입인지 검증
    return this.appService.getManyMovies(title);
  }

  @Get(':id')
  getMovie(@Param('id') id: string) {
    return this.appService.getMovieById(+id); // +id: string을 number로 바꿔서 넣어준다. 
  }

  @Post()
  postMovie(
    @Body('title') title: string,
  ) {
    return this.appService.createMovie(title);
  }

  @Patch(':id')
  patchMovie(
    @Param('id') id: string,
    @Body('title') title: string,
  ) {
    return this.appService.updateMovie(+id, title);
  }

  @Delete(':id')
  deleteMovie(
    @Param('id') id: string,
  ) {
    return this.appService.deleteMovie(+id);
  }
}
