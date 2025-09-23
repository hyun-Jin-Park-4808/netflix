import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseTable } from '../../common/entity/base-table.entity';
import { MovieDetail } from './movie-detail.entity';
import { Director } from 'src/director/entity/director.entity';

// @ManyToOne Director -> 감독은 여러 개의 영화를 만들 수 있음
// @OneToOne MovieDetail -> 영화는 하나의 상세 내용을 갖을 수 있음
// @ManyToMany Genre -> 영화는 여러 개의 장르를 가질 수 있고, 장르는 여러 개의 영화에 속할 수 있음@Entity()
@Entity()
export class Movie extends BaseTable {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  genre: string;

  @OneToOne(() => MovieDetail, (movieDetail) => movieDetail.id, {
    cascade: true, // movie crud 할 때 detail도 같이 crud 해주는 옵션
  })
  @JoinColumn() // movie 테이블에 detailId 생김
  detail: MovieDetail;

  @ManyToOne(() => Director, (director) => director.id) // directorId 라는 컬럼 생김
  director: Director;
}
