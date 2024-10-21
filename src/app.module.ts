import { Module } from '@nestjs/common';
import { MovieModule } from './movie/movie.module';

@Module({
  imports: [MovieModule], // 다른 모듈을 이 모듈로 불러들일 때 사용, nest g로 생성한 모듈은 자동 주입 된다. 
})
export class AppModule {}
