import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Director } from 'src/director/entity/director.entity';
import { Genre } from 'src/genre/entity/genre.entity';
import { DataSource, In, QueryRunner, Repository } from 'typeorm';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { MovieDetail } from './entity/movie-detail.entity';
import { Movie } from './entity/movie.entity';
import { GetMoviesDto } from './dto/get-movies.dto';
import { CommonService } from 'src/common/common.service';
import { join } from 'path';
import { rename } from 'fs/promises';
import { User } from 'src/user/entity/user.entity';
import { MovieUserLike } from './entity/movie-user-like.entity';

@Injectable() // IoC에서 AppService를 인스턴스화해서 다른 클래스에 알아서 주입할 수 있도록 관리하게 된다.
export class MovieService {
  constructor(
    @InjectRepository(Movie)
    private readonly movieRepository: Repository<Movie>,
    @InjectRepository(MovieDetail)
    private readonly movieDetailRepository: Repository<MovieDetail>,
    @InjectRepository(Director)
    private readonly directorRepository: Repository<Director>,
    @InjectRepository(Genre)
    private readonly genreRepository: Repository<Genre>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(MovieUserLike)
    private readonly movieUserLikeRepository: Repository<MovieUserLike>,
    private readonly dataSource: DataSource,
    private readonly commonService: CommonService,
  ) {}

  async findAll(dto: GetMoviesDto, userId?: number) {
    const { title } = dto;

    const qb = await this.movieRepository
      .createQueryBuilder('movie')
      .leftJoinAndSelect('movie.director', 'director')
      .leftJoinAndSelect('movie.genres', 'genres');

    if (title) {
      qb.andWhere('movie.title LIKE :title', { title: `%${title}%` });
    }
    const { nextCursor } =
      await this.commonService.applyCursorPaginationParamsToQb(qb, dto);

    let [data, count] = await qb.getManyAndCount(); // qb에 applyCursorPaginationParamsToQb()를 통해 페이지네이션 적용된다.

    if (userId) {
      const movieIds = data.map((movie) => movie.id);

      // 로그인한 유저가 좋아요한 영화들을 추출한다.
      const likedMovies =
        movieIds.length < 1
          ? []
          : await this.movieUserLikeRepository
              .createQueryBuilder('movieUserLike')
              .leftJoinAndSelect('movieUserLike.movie', 'movie')
              .leftJoinAndSelect('movieUserLike.user', 'user')
              .where('movie.id IN (:...movieIds)', { movieIds })
              .andWhere('user.id = :userId', { userId })
              .getMany();

      /**
       * 로그인한 유저가 좋아요한 영화 map 만들기
       * 아래 구조로 likedMovieMap 만들기
       * {
       * movieId: boolean
       * }
       */
      const likedMovieMap = likedMovies.reduce(
        (acc, next) => ({
          ...acc,
          [next.movie.id]: next.isLike, // { movieId: boolean } 형태로 축적됨
        }),
        {},
      );

      data = data.map((x) => ({
        ...x, // 기존 data 객체에 likeStatus(null || true || false)를 추가해줌
        likeStatus: x.id in likedMovieMap ? likedMovieMap[x.id] : null,
      }));
    }
    return { data, nextCursor, count };
  }

  async findOne(id: number) {
    const movie = await this.movieRepository
      .createQueryBuilder('movie')
      .leftJoinAndSelect('movie.director', 'director')
      .leftJoinAndSelect('movie.genres', 'genres')
      .leftJoinAndSelect('movie.detail', 'detail')
      .leftJoinAndSelect('movie.creator', 'creator')
      .where('movie.id = :id', { id })
      .getOne();

    if (!movie) {
      throw new NotFoundException('존재하지 않는 영화입니다.');
    }
    return movie;
  }

  async create(
    createMovieDto: CreateMovieDto,
    userId: number,
    qr: QueryRunner,
  ) {
    const director = await qr.manager.findOne(Director, {
      where: { id: createMovieDto.directorId },
    });
    if (!director) {
      throw new NotFoundException('존재하지 않는 감독입니다.');
    }

    const genres = await qr.manager.find(Genre, {
      where: {
        id: In(createMovieDto.genreIds),
      },
    });

    if (genres.length !== createMovieDto.genreIds.length) {
      throw new NotFoundException(
        `존재하지 않는 장르가 있습니다. 존재하는 ids -> ${genres.map((genre) => genre.id).join(',')}`,
      );
    }
    const movieDetail = await qr.manager
      .createQueryBuilder()
      .insert()
      .into(MovieDetail)
      .values({
        detail: createMovieDto.detail,
      })
      .execute();

    const movieDetailId = movieDetail.identifiers[0].id;

    const movieFoler = join('public', 'movie');
    const tempFoler = join('public', 'temp');

    const movie = await qr.manager
      .createQueryBuilder()
      .insert()
      .into(Movie)
      .values({
        title: createMovieDto.title,
        detail: { id: movieDetailId }, // queryBuilder로는 다른 테이블에 동시에 데이터 만드는 건 안되고 따로 따로 만들고 연관관계만 넣어줄 수 있음.
        director,
        creator: { id: userId },
        movieFilePath: join(movieFoler, createMovieDto.movieFileName),
        genres,
      })
      .execute();

    const movieId = movie.identifiers[0].id;

    // 무비와 장르 간의 manyToMany 연관관계 추가
    await qr.manager
      .createQueryBuilder()
      .relation(Movie, 'genres') // Movie의 genres 필드에 연관관계 추가
      .of(movieId) // Movie중 id = movieId 에 연관관계 추가
      .add(genres.map((genre) => genre.id)); // 장르 id 들을 추가

    await rename(
      // transaction 범위에 포함되지 않기 때문에 transaction 범위 끝나고 실행하기
      join(process.cwd(), tempFoler, createMovieDto.movieFileName),
      join(process.cwd(), movieFoler, createMovieDto.movieFileName),
    );

    return await qr.manager.findOne(Movie, {
      // qr로 가져와야 트랜잭션 인터셉터에서 커밋되기 전에 저장된 데이터를 가져올 수 있다.
      where: { id: movieId },
      relations: ['detail', 'director', 'genres'],
    });
  }

  async update(id: number, updateMovieDto: UpdateMovieDto) {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();
    try {
      const movie = await qr.manager.findOne(Movie, {
        where: { id },
        relations: ['detail', 'genres'],
      });
      if (!movie) {
        throw new NotFoundException('존재하지 않는 ID의 영화입니다');
      }

      const { detail, directorId, genreIds, ...movieRest } = updateMovieDto;

      let newDirector;

      if (directorId) {
        const director = await qr.manager.findOne(Director, {
          where: { id: directorId },
        });
        if (!director) {
          throw new NotFoundException('존재하지 않는 ID의 감독입니다');
        }
        newDirector = director;
      }

      let newGenres;

      if (genreIds) {
        const genres = await qr.manager.find(Genre, {
          where: {
            id: In(genreIds),
          },
        });

        if (genres.length !== updateMovieDto.genreIds.length) {
          throw new NotFoundException(
            `존재하지 않는 장르가 있습니다. 존재하는 ids -> ${genres.map((genre) => genre.id).join(',')}`,
          );
        }

        newGenres = genres;
      }

      const movieUpdateFields = {
        ...movieRest,
        ...(newDirector && { director: newDirector }), //  newDirector 이 있으면 director에 값을 넣어줌
      };

      await qr.manager
        .createQueryBuilder()
        .update(Movie)
        .set(movieUpdateFields)
        .where('id = :id', { id })
        .execute();

      // await this.movieRepository.update({ id }, movieUpdateFields); // 얘는 다른  where 조건 추가 가능

      if (detail) {
        await qr.manager
          .createQueryBuilder()
          .update(MovieDetail)
          .set({ detail })
          .where('id = :id', { id: movie.detail.id })
          .execute();
      }

      if (newGenres) {
        await qr.manager
          .createQueryBuilder()
          .relation(Movie, 'genres') // Movie의 genres 필드에 연관관계 추가
          .of(id) // Movie중 id = movieId 에 연관관계 추가
          .addAndRemove(
            newGenres.map((genre) => genre.id), // 새로 추가할 장르 id들
            movie.genres.map((genre) => genre.id), // 삭제할 기존 장르 id들
          );
      }

      await qr.commitTransaction();
      return this.movieRepository.findOne({
        where: { id },
        relations: ['detail', 'director', 'genres'],
      });
    } catch (error) {
      await qr.rollbackTransaction();
      throw error;
    } finally {
      await qr.release();
    }
  }

  async remove(id: number) {
    const movie = await this.movieRepository.findOne({
      where: { id },
      relations: ['detail'],
    });
    if (!movie) {
      throw new NotFoundException('존재하지 않는 ID의 영화입니다');
    }

    await this.movieRepository
      .createQueryBuilder()
      .delete()
      .where('id = :id', { id })
      .execute();

    // await this.movieRepository.delete(id);
    await this.movieDetailRepository.delete(movie.detail.id);

    return id;
  }

  async toggleMovieLike(movieId: number, userId: number, isLike: boolean) {
    const movie = await this.movieRepository.findOne({
      where: { id: movieId },
    });
    if (!movie) {
      throw new NotFoundException('존재하지 않는 영화입니다.');
    }

    const user = await this.userRepository.findOne({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('존재하지 않는 사용자입니다.');
    }

    const likeRecord = await this.movieUserLikeRepository
      .createQueryBuilder('movieUserLike')
      .leftJoinAndSelect('movieUserLike.movie', 'movie')
      .leftJoinAndSelect('movieUserLike.user', 'user')
      .where('movie.id = :movieId', { movieId })
      .andWhere('user.id = :userId', { userId })
      .getOne();

    if (likeRecord) {
      if (isLike === likeRecord.isLike) {
        await this.movieUserLikeRepository.delete({ movie, user });
      } else {
        await this.movieUserLikeRepository.update({ movie, user }, { isLike });
      }
    } else {
      await this.movieUserLikeRepository.save({
        movie,
        user,
        isLike,
      });
    }

    const result = await this.movieUserLikeRepository
      .createQueryBuilder('movieUserLike')
      .leftJoinAndSelect('movieUserLike.movie', 'movie')
      .leftJoinAndSelect('movieUserLike.user', 'user')
      .where('movie.id = :movieId', { movieId })
      .andWhere('user.id = :userId', { userId })
      .getOne();

    return {
      isLike: result && result.isLike, // result가 falsy면 result값 그대로 반환(Null), result가 truthy면 result.isLike값을 반환
    };
  }
}
