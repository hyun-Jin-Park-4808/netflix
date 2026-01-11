import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { readdir, unlink } from 'fs/promises';
import { join, parse } from 'path';

@Injectable()
export class TasksService {
  constructor() {}

  // @Cron('* * * * * *')
  async eraseOrphanFiles() {
    // readdir: path 의 모든 파일 목록 추출
    const files = await readdir(join(process.cwd(), 'public', 'temp'));

    const deleteFilesTargets = files.filter((file) => {
      const fileName = parse(file).name; // name: 확장자 제외한 이름
      const split = fileName.split('_'); // 날짜값 구하기 위해 split
      if (split.length !== 2) {
        return true;
      }

      try {
        const date = +new Date(parseInt(split[split.length - 1]));
        const aDayInMilliseconds = 24 * 60 * 60 * 1000; // 하루를 밀리초로 변환
        const now = +new Date();
        return now - date > aDayInMilliseconds;
      } catch (error) {
        return true;
      }
    });

    // unlink: 파일 삭제 함수
    await Promise.all(
      deleteFilesTargets.map((file) =>
        unlink(join(process.cwd(), 'public', 'temp', file)),
      ),
    );
  }
}
