import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import * as ffmpegFluent from 'fluent-ffmpeg';
import { join } from 'path';

@Processor('thumbnail-generation') // thumbnail-generation 큐에 작업이 추가되면 이 프로세서가 작업을 가져와서 처리한다. (process() 실행)
export class ThumbnailGenerationProcess extends WorkerHost {
  process(job: Job, token?: string): Promise<any> {
    const { videoPath, videoId } = job.data;
    console.log(`영상 트랜스코딩중... ID: ${videoId}`);
    const outputDirectory = join(process.cwd(), 'public', 'thumbnails');

    return ffmpegFluent(videoPath).screenshots({
      count: 1,
      filename: `${videoId}.jpg`,
      folder: outputDirectory,
      size: '320x240',
    })
    .on('end', () => {
      console.log(`썸네일 생성 완료! ID: ${videoId}`);
    })
    .on('error', (err) => {
      console.log(`썸네일 생성 실패! ID: ${videoId}`);
    });
  }
}
