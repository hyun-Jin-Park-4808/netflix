import { User } from 'src/user/entity/user.entity';
import { Column, Entity, ManyToOne, PrimaryColumn } from 'typeorm';
import { Movie } from './movie.entity';

@Entity()
export class MovieUserLike {
  // movieId, userId 두 개를 조합한 primary key
  // movieId, userId 두 개를 조합한 결과는 중복이 발생하면 안된다.
  @PrimaryColumn({
    name: 'movieId',
    type: 'int8',
  })
  @ManyToOne(() => Movie, (movie) => movie.likedUsers, {
    onDelete: 'CASCADE', // 영화가 삭제되면 좋아요 내역도 삭제하는 옵션
  })
  movie: Movie;

  @PrimaryColumn({
    name: 'userId',
    type: 'int8',
  })
  @ManyToOne(() => User, (user) => user.likedMovies, {
    onDelete: 'CASCADE', // 사용자가 삭제되면 좋아요 내역도 삭제하는 옵션
  })
  user: User;

  @Column()
  isLike: boolean;
}
