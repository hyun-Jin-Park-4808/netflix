import { Module } from '@nestjs/common';
import { CommonService } from './common.service';
import { CommonController } from './common.controller';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { join } from 'path';
import { v4 } from 'uuid';

@Module({
  imports: [
    MulterModule.register({
      storage: diskStorage({
        // diskStorage: 로컬 저장소에 저장하겠다.
        destination: join(process.cwd(), 'public', 'temp'), // 저장할 위치, join으로 쓰면 운영체제 따라 올바른 path로 변경된다.
        filename: (req, file, cb) => {
          const split = file.originalname.split('.');
          let extention = 'mp4';

          if (split.length > 1) {
            extention = split[split.length - 1];
          }
          cb(null, `${v4()}_${Date.now()}.${extention}`);
        },
      }),
    }),
  ],
  controllers: [CommonController],
  providers: [CommonService],
  exports: [CommonService],
})
export class CommonModule {}
