import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { v4 } from 'uuid';
import { rename } from 'fs/promises'; // promises 기반의 파일 시스템(fs)
import { join } from 'path';

@Injectable()
// PipeTransform<변환할 필드 타입, 반환할 필드 타입>
export class MovieFilePipe
  implements PipeTransform<Express.Multer.File, Promise<Express.Multer.File>>
{
  constructor(
    private readonly options: {
      maxSize: number;
      mimeTypes: string;
    },
  ) {}

  async transform(
    value: Express.Multer.File,
    metaData: ArgumentMetadata,
  ): Promise<Express.Multer.File> {
    if (!value) {
      throw new BadRequestException('movie 필드는 필수입니다.');
    }

    const byteSize = this.options.maxSize * 1000000; // 단위: MB (1000000 byte)

    if (value.size > byteSize) {
      throw new BadRequestException(
        `${this.options.maxSize}MB 이하의 파일을 업로드해주세요.`,
      );
    }

    if (value.mimetype !== this.options.mimeTypes) {
      throw new BadRequestException('파일 형식이 잘못되었습니다.');
    }

    const split = value.originalname.split('.');
    let extention = 'mp4';

    if (split.length > 1) {
      extention = split[split.length - 1];
    }

    const filename = `${v4()}_${Date.now()}.${extention}`;
    const newPath = join(value.destination, filename);

    await rename(value.path, newPath);

    return {
      ...value,
      filename,
      path: newPath,
    };
  }
}
