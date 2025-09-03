import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseTable } from './base-table.entity';
import { MovieDetail } from './movie-detail.entity';

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

  @OneToOne(() => MovieDetail)
  @JoinColumn() // movie 테이블에 detailId 생김
  detail: MovieDetail;
}
