import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CommonService } from './common.service';

@Controller('common')
@ApiBearerAuth()
@ApiTags('common')
export class CommonController {
  constructor(private readonly commonService: CommonService) {}

  @Post('video')
  @UseInterceptors(
    FileInterceptor('video', {
      limits: {
        fileSize: 20000000, // 20MB
      },
      fileFilter(req, file, cb) {
        if (file.mimetype !== 'video/mp4') {
          return cb(new BadRequestException('mp4 타입만 입력해주세요.'), false);
        }
        return cb(null, true); // null 부분에 에러 넣어주면 에러 던지게 된다. true 로 설정하면 파일을 받아볼 수 있고 false로 설정하면 파일 안받는다.
      },
    }),
  )
  createVideo(
    // @UploadedFiles() files: Express.Multer.File[],
    // @UploadedFile(
    //   new MovieFilePipe({
    //     maxSize: 20, // 20MB
    //     mimeTypes: 'video/mp4',
    //   }),
    // ) movie: Express.Multer.File, // 이렇게 파이프로 파일 이름 변경할 수 있지만 모듈에서 파일명 변경하는 코드 넣는 것이 훨씬 간단하고,
    // 인터셉터 -> 파이프이기 때문에 인터셉터의 필터링 조건과 파이프의 필터링 조건이 다르면 인터셉터에서 통과해 업로드 되고 나서 파이프에서 에러가 발생할 수도 있다.
    // 인터셉터 전에 적용되는 미들웨어 -> 가드 (-> 인터셉터) 에서 파일 업로드를 막아야한다.
    @UploadedFile() video: Express.Multer.File,
  ) {
    return {
      fileName: video.filename,
    };
  }

  @Post('presigned-url')
  async createPresignedUrl() {
    // 해당 api 호출해서 반환된 Url로 body에 binary 선택 후 PUT 요청으로 파일 업로드하면 파일 저장된다.
    return { url: await this.commonService.createPresignedUrl() };
  }
}
