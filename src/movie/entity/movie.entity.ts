import {
  ChildEntity,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  TableInheritance,
  UpdateDateColumn,
  VersionColumn,
} from 'typeorm';

export class BaseEntity {
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @VersionColumn()
  version: number;
}

// movie / series -> Content 
// runtime(영화 상영시간) / seriesCount(몇 부작)
@Entity()
@TableInheritance({
  column: {
    type: 'varchar',
    name: 'type',
  },
}) //Series인 지 구분하는 type 컬럼 생김
export class Content extends BaseEntity { // content 테이블 하나 생김. Movie인지, 

  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  genre: string;
}


@ChildEntity()
export class Movie extends Content {
  @Column()
  runtime: number;
}

@ChildEntity()
export class Series extends Content {
  @Column()
  seriesCount: number;
}