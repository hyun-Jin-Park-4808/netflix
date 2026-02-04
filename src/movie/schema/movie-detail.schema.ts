import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Movie } from './movie.schema';

@Schema({
  timestamps: true,
})
export class MovieDetail extends Document {
  @Prop({
    required: true,
  })
  detail: string;

  // 1:1 관계를 맺을 때 movie, movieDetail 둘 다 서로 required로 설정하면 오류가 발생한다.
  // @Prop({
  //   type: Types.ObjectId,
  //   ref: 'Movie',
  //   required: true,
  //   unique: true,
  // })
  // movie: Movie;
}

export const MovieDetailSchema = SchemaFactory.createForClass(MovieDetail);
