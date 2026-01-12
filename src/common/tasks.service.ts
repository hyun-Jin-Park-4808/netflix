import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { Cron, SchedulerRegistry } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { readdir, unlink } from 'fs/promises';
import { join, parse } from 'path';
import { Movie } from 'src/movie/entity/movie.entity';
import { Repository } from 'typeorm';
import { DefaultLogger } from './logger/default.logger';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

@Injectable()
export class TasksService {
  // private readonly logger = new Logger(TasksService.name); // Logger(context): LOG [TasksService] 이런식으로 로그에 찍힘
  constructor(
    @InjectRepository(Movie)
    private readonly movieRepository: Repository<Movie>,
    private readonly schedulerRegistry: SchedulerRegistry,
    // private readonly logger: DefaultLogger,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {}

  // @Cron('*/5 * * * * *')
  async logEverySeconds() {
    // 순서대로 중요한 로그
    this.logger.fatal('FATAL 레벨 로그', null, TasksService.name); // context 이름을 넣어줌, fatal, error는 두 번째 인자에 message나 stack trace 인자를 받는다.
    this.logger.error('ERROR 레벨 로그', null, TasksService.name);
    this.logger.warn('WARN 레벨 로그', TasksService.name);
    this.logger.log('INFO 레벨 로그', TasksService.name);
    this.logger.debug('DEBUG 레벨 로그', TasksService.name);
    this.logger.verbose('VERBOSE 레벨 로그', TasksService.name);
  }

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

  // @Cron('0 * * * * *') // 1분마다 실행
  async calcultateMovieLikeCount() {
    console.log('run');
    await this.movieRepository.query(
      `
      UPDATE movie m 
      SET "likeCount" = (
        SELECT COUNT(*) 
        FROM movie_user_like mul 
        WHERE m.id = mul."movieId" And mul."isLike" = true
      )`,
    );
    await this.movieRepository.query(
      `
      UPDATE movie m 
      SET "dislikeCount" = (
        SELECT COUNT(*) 
        FROM movie_user_like mul 
        WHERE m.id = mul."movieId" And mul."isLike" = false
      )`,
    );
  }

  // @Cron('* * * * * *', {
  //   name: 'printer',
  // })
  printer() {
    console.log('print every seconds');
  }

  // @Cron('*/5 * * * * *')
  stropper() {
    console.log('---stopper run---');
    const job = this.schedulerRegistry.getCronJob('printer');

    // console.log('#Last Date');
    // console.log(job.lastDate());
    // console.log('#Next Date');
    // console.log(job.nextDate());
    // console.log('#Next Dates');
    // console.log(job.nextDates(5));

    if ((job as any).running) {
      job.stop();
    } else {
      job.start();
    }
  }
}
