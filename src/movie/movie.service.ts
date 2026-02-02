import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { rename } from 'fs/promises';
import { join } from 'path';
import { CommonService } from 'src/common/common.service';
import { Director } from 'src/director/entity/director.entity';
import { Genre } from 'src/genre/entity/genre.entity';
import { User } from 'src/user/entity/user.entity';
import { DataSource, In, QueryRunner, Repository } from 'typeorm';
import { CreateMovieDto } from './dto/create-movie.dto';
import { GetMoviesDto } from './dto/get-movies.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { MovieDetail } from './entity/movie-detail.entity';
import { MovieUserLike } from './entity/movie-user-like.entity';
import { Movie } from './entity/movie.entity';
import { ConfigService } from '@nestjs/config';
import { envVarableKeys } from 'src/common/const/env.const';
import { PrismaService } from 'src/common/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable() // IoC에서 AppService를 인스턴스화해서 다른 클래스에 알아서 주입할 수 있도록 관리하게 된다.
export class MovieService {
  constructor(
    // @InjectRepository(Movie)
    // private readonly movieRepository: Repository<Movie>,
    // @InjectRepository(MovieDetail)
    // private readonly movieDetailRepository: Repository<MovieDetail>,
    // @InjectRepository(User)
    // private readonly userRepository: Repository<User>,
    // @InjectRepository(MovieUserLike)
    // private readonly movieUserLikeRepository: Repository<MovieUserLike>,
    private readonly dataSource: DataSource,
    private readonly commonService: CommonService,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache, // 메모리에 있기 때문에 재시작하면 리셋된다.
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async findRecent() {
    const cacheData = await this.cacheManager.get('MOVIE_RECENT');

    if (cacheData) {
      return cacheData;
    }

    const data = await this.prisma.movie.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    });
    // const data = await this.movieRepository.find({
    //   order: {
    //     createdAt: 'DESC',
    //   },
    //   take: 10,
    // });

    // 모듈 단위에 적용한 것보다 서비스단이 더 상위 단이기 때문에 서비스에 적용한 ttl이 오버라이딩된다.
    await this.cacheManager.set('MOVIE_RECENT', data); // ttl: 0으로 설정하면 캐싱된 데이터 계속 가지고 있는다.
    return data;
  }

  /* istanbul ignore next */
  async getMovies() {
    // return this.movieRepository
    //   .createQueryBuilder('movie')
    //   .leftJoinAndSelect('movie.director', 'director')
    //   .leftJoinAndSelect('movie.genres', 'genres');
  }

  /* istanbul ignore next */
  async getLikedMovies(movieIds: number[], userId: number) {
    // return this.movieUserLikeRepository
    //   .createQueryBuilder('movieUserLike')
    //   .leftJoinAndSelect('movieUserLike.movie', 'movie')
    //   .leftJoinAndSelect('movieUserLike.user', 'user')
    //   .where('movie.id IN (:...movieIds)', { movieIds })
    //   .andWhere('user.id = :userId', { userId })
    //   .getMany();
  }

  async findAll(dto: GetMoviesDto, userId?: number) {
    const { title, cursor, take, order } = dto;

    const orderBy = order.map((field) => {
      const [column, direction] = field.split('_');
      return { [column]: direction.toLocaleLowerCase() };
    });

    const movies = await this.prisma.movie.findMany({
      where: title ? { title: { contains: title } } : {},
      take: take + 1, // 20개를 가져온다 하면 21번째 값으로 커서를 만들어야 해서 1개 더 가져와야 한다.
      skip: cursor ? 1 : 0, // 커서부터 값을 가져오기 때문에 그 값은 스킵하고 다음 값부터 가져오면 된다.
      cursor: cursor ? { id: parseInt(cursor) } : undefined,
      orderBy,
      include: {
        genres: true,
        director: true,
      },
    });

    const hasNextPage = movies.length > take;

    if (hasNextPage) {
      movies.pop();
    }

    const nextCursor = hasNextPage
      ? movies[movies.length - 1].id.toString()
      : null;
    // const qb = await this.getMovies();

    // if (title) {
    //   qb.andWhere('movie.title LIKE :title', { title: `%${title}%` });
    // }
    // const { nextCursor } =
    //   await this.commonService.applyCursorPaginationParamsToQb(qb, dto);

    // eslint-disable-next-line prefer-const
    // let [data, count] = await qb.getManyAndCount(); // qb에 applyCursorPaginationParamsToQb()를 통해 페이지네이션 적용된다.

    if (userId) {
      const movieIds = movies.map((movie) => movie.id);
      // const movieIds = data.map((movie) => movie.id);

      // 로그인한 유저가 좋아요한 영화들을 추출한다.
      const likedMovies =
        movieIds.length < 1
          ? []
          : await this.prisma.movieUserLike.findMany({
              where: {
                movieId: { in: movieIds },
                userId,
              },
              include: {
                movie: true,
              },
            });
      // const likedMovies =
      //   movieIds.length < 1 ? [] : await this.getLikedMovies(movieIds, userId);

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

      return {
        data: movies.map((movie) => ({
          ...movie,
          likeStatus:
            movie.id in likedMovieMap ? likedMovieMap[movie.id] : null,
        })),
        nextCursor,
        hasNextPage,
      };
      //   data = data.map((x) => ({
      //     ...x, // 기존 data 객체에 likeStatus(null || true || false)를 추가해줌
      //     likeStatus: x.id in likedMovieMap ? likedMovieMap[x.id] : null,
      //   }));
    }
    return {
      data: movies,
      nextCursor,
      hasNextPage,
    };
    // return { data, nextCursor, count };
  }

  /* istanbul ignore next */
  async findMovieDetail(id: number) {
    // return this.movieRepository
    //   .createQueryBuilder('movie')
    //   .leftJoinAndSelect('movie.director', 'director')
    //   .leftJoinAndSelect('movie.genres', 'genres')
    //   .leftJoinAndSelect('movie.detail', 'detail')
    //   .leftJoinAndSelect('movie.creator', 'creator')
    //   .where('movie.id = :id', { id })
    //   .getOne();
  }

  async findOne(id: number) {
    const movie = await this.prisma.movie.findUnique({
      where: {
        id,
      },
    });
    // const movie = await this.findMovieDetail(id);

    if (!movie) {
      throw new NotFoundException('존재하지 않는 영화입니다.');
    }
    return movie;
  }

  /* istanbul ignore next */
  async createMovieDetail(qr: QueryRunner, createMovieDto: CreateMovieDto) {
    // return qr.manager
    //   .createQueryBuilder()
    //   .insert()
    //   .into(MovieDetail)
    //   .values({
    //     detail: createMovieDto.detail,
    //   })
    //   .execute();
  }

  /* istanbul ignore next */
  async createMovie(
    qr: QueryRunner,
    createMovieDto: CreateMovieDto,
    director: Director,
    movieDetailId: number,
    userId: number,
    movieFolder: string,
  ) {
    // return qr.manager
    //   .createQueryBuilder()
    //   .insert()
    //   .into(Movie)
    //   .values({
    //     title: createMovieDto.title,
    //     detail: { id: movieDetailId }, // queryBuilder로는 다른 테이블에 동시에 데이터 만드는 건 안되고 따로 따로 만들고 연관관계만 넣어줄 수 있음.
    //     director,
    //     creator: { id: userId },
    //     movieFilePath: join(movieFolder, createMovieDto.movieFileName),
    //   })
    //   .execute();
  }

  // 무비와 장르 간의 manyToMany 연관관계 추가
  /* istanbul ignore next */
  async createMovieGenreRelation(
    qr: QueryRunner,
    movieId: number,
    genres: Genre[],
  ) {
    // return qr.manager
    //   .createQueryBuilder()
    //   .relation(Movie, 'genres') // Movie의 genres 필드에 연관관계 추가
    //   .of(movieId) // Movie중 id = movieId 에 연관관계 추가
    //   .add(genres.map((genre) => genre.id)); // 장르 id 들을 추가
  }

  /* istanbul ignore next */
  async renameMovieFile(
    tempFolder: string,
    movieFolder: string,
    createMovieDto: CreateMovieDto,
  ) {
    if (this.configService.get<string>(envVarableKeys.env) !== 'prod') {
      // transaction 범위에 포함되지 않기 때문에 transaction 범위 끝나고 실행하기
      return rename(
        join(process.cwd(), tempFolder, createMovieDto.movieFileName),
        join(process.cwd(), movieFolder, createMovieDto.movieFileName),
      );
    } else {
      return this.commonService.saveMovieToPermanentStorage(
        createMovieDto.movieFileName,
      );
    }
  }

  async create(createMovieDto: CreateMovieDto, userId: number) {
    return this.prisma.$transaction(async (prisma) => {
      const director = await prisma.director.findUnique({
        where: { id: createMovieDto.directorId },
      });

      if (!director) {
        throw new NotFoundException('존재하지 않는 감독입니다.');
      }

      const genres = await prisma.genre.findMany({
        where: {
          id: { in: createMovieDto.genreIds },
        },
      });

      if (genres.length !== createMovieDto.genreIds.length) {
        throw new NotFoundException(
          `존재하지 않는 장르가 있습니다. 존재하는 ids -> ${genres.map((genre) => genre.id).join(',')}`,
        );
      }

      const movieDetail = await prisma.movieDetail.create({
        data: {
          detail: createMovieDto.detail,
        },
      });

      const movie = await prisma.movie.create({
        data: {
          title: createMovieDto.title,
          movieFilePath: createMovieDto.movieFileName,
          creator: { connect: { id: userId } },
          director: { connect: { id: director.id } },
          genres: { connect: genres.map((genre) => ({ id: genre.id })) },
          detail: { connect: { id: movieDetail.id } },
        },
      });

      return await prisma.movie.findUnique({
        where: { id: movie.id },
        include: { detail: true, director: true, genres: true },
      });
    });
  }

  // async create(
  //   createMovieDto: CreateMovieDto,
  //   userId: number,
  //   // qr: QueryRunner,
  // ) {
  //   // const director = await qr.manager.findOne(Director, {
  //   //   where: { id: createMovieDto.directorId },
  //   // });
  //   if (!director) {
  //     throw new NotFoundException('존재하지 않는 감독입니다.');
  //   }

  //   const genres = await qr.manager.find(Genre, {
  //     where: {
  //       id: In(createMovieDto.genreIds),
  //     },
  //   });

  //   if (genres.length !== createMovieDto.genreIds.length) {
  //     throw new NotFoundException(
  //       `존재하지 않는 장르가 있습니다. 존재하는 ids -> ${genres.map((genre) => genre.id).join(',')}`,
  //     );
  //   }
  //   const movieDetail = await this.createMovieDetail(qr, createMovieDto);

  //   const movieDetailId = movieDetail.identifiers[0].id;

  //   const movieFolder = join('public', 'movie');
  //   const tempFolder = join('public', 'temp');

  //   const movie = await this.createMovie(
  //     qr,
  //     createMovieDto,
  //     director,
  //     movieDetailId,
  //     userId,
  //     movieFolder,
  //   );

  //   const movieId = movie.identifiers[0].id;

  //   await this.createMovieGenreRelation(qr, movieId, genres);

  //   await this.renameMovieFile(tempFolder, movieFolder, createMovieDto);

  //   return await qr.manager.findOne(Movie, {
  //     // qr로 가져와야 트랜잭션 인터셉터에서 커밋되기 전에 저장된 데이터를 가져올 수 있다.
  //     where: { id: movieId },
  //     relations: ['detail', 'director', 'genres'],
  //   });
  // }

  /* istanbul ignore next */
  async updateMovie(qr: QueryRunner, id: number, movieUpdateFields: any) {
    // return qr.manager
    //   .createQueryBuilder()
    //   .update(Movie)
    //   .set(movieUpdateFields)
    //   .where('id = :id', { id })
    //   .execute();
  }

  /* istanbul ignore next */
  async updateMovieDetail(qr: QueryRunner, detail: string, movie: Movie) {
    // return qr.manager
    //   .createQueryBuilder()
    //   .update(MovieDetail)
    //   .set({ detail })
    //   .where('id = :id', { id: movie.detail.id })
    //   .execute();
  }

  /* istanbul ignore next */
  async updateMovieGenreRelation(
    qr: QueryRunner,
    id: number,
    newGenres: Genre[],
    movie: Movie,
  ) {
    // return qr.manager
    //   .createQueryBuilder()
    //   .relation(Movie, 'genres') // Movie의 genres 필드에 연관관계 추가
    //   .of(id) // Movie중 id = movieId 에 연관관계 추가
    //   .addAndRemove(
    //     newGenres.map((genre) => genre.id), // 새로 추가할 장르 id들
    //     movie.genres.map((genre) => genre.id), // 삭제할 기존 장르 id들
    //   );
  }

  async update(id: number, updateMovieDto: UpdateMovieDto) {
    return this.prisma.$transaction(async (prisma) => {
      const movie = await prisma.movie.findUnique({
        where: { id },
        include: { detail: true, genres: true },
      });
      if (!movie) {
        throw new NotFoundException('존재하지 않는 ID의 영화입니다');
      }

      const { detail, directorId, genreIds, ...movieRest } = updateMovieDto;

      const movieUpdateParams: Prisma.MovieUpdateInput = {
        ...movieRest,
      };

      if (directorId) {
        const director = await prisma.director.findUnique({
          where: { id: directorId },
        });
        if (!director) {
          throw new NotFoundException('존재하지 않는 ID의 감독입니다');
        }
        movieUpdateParams.director = { connect: { id: director.id } };
      }

      if (genreIds) {
        const genres = await prisma.genre.findMany({
          where: {
            id: { in: genreIds },
          },
        });

        if (genres.length !== updateMovieDto.genreIds.length) {
          throw new NotFoundException(
            `존재하지 않는 장르가 있습니다. 존재하는 ids -> ${genres.map((genre) => genre.id).join(',')}`,
          );
        }

        movieUpdateParams.genres = {
          set: genres.map((genre) => ({ id: genre.id })),
        };
      }

      await prisma.movie.update({
        where: { id },
        data: movieUpdateParams,
      });

      if (detail) {
        await prisma.movieDetail.update({
          where: { id: movie.detail.id },
          data: { detail },
        });
      }

      return await prisma.movie.findUnique({
        where: { id },
        include: { detail: true, director: true, genres: true },
      });
    });
  }

  // async update(id: number, updateMovieDto: UpdateMovieDto) {
  //   const qr = this.dataSource.createQueryRunner();
  //   await qr.connect();
  //   await qr.startTransaction();
  //   try {
  //     const movie = await qr.manager.findOne(Movie, {
  //       where: { id },
  //       relations: ['detail', 'genres'],
  //     });
  //     if (!movie) {
  //       throw new NotFoundException('존재하지 않는 ID의 영화입니다');
  //     }

  //     const { detail, directorId, genreIds, ...movieRest } = updateMovieDto;

  //     let newDirector;

  //     if (directorId) {
  //       const director = await qr.manager.findOne(Director, {
  //         where: { id: directorId },
  //       });
  //       if (!director) {
  //         throw new NotFoundException('존재하지 않는 ID의 감독입니다');
  //       }
  //       newDirector = director;
  //     }

  //     let newGenres;

  //     if (genreIds) {
  //       const genres = await qr.manager.find(Genre, {
  //         where: {
  //           id: In(genreIds),
  //         },
  //       });

  //       if (genres.length !== updateMovieDto.genreIds.length) {
  //         throw new NotFoundException(
  //           `존재하지 않는 장르가 있습니다. 존재하는 ids -> ${genres.map((genre) => genre.id).join(',')}`,
  //         );
  //       }

  //       newGenres = genres;
  //     }

  //     const movieUpdateFields = {
  //       ...movieRest,
  //       ...(newDirector && { director: newDirector }), //  newDirector 이 있으면 director에 값을 넣어줌
  //     };

  //     await this.updateMovie(qr, id, movieUpdateFields);
  //     // await this.movieRepository.update({ id }, movieUpdateFields); // 얘는 다른  where 조건 추가 가능

  //     if (detail) {
  //       await this.updateMovieDetail(qr, detail, movie);
  //     }

  //     if (newGenres) {
  //       await this.updateMovieGenreRelation(qr, id, newGenres, movie);
  //     }

  //     await qr.commitTransaction();
  //     return this.movieRepository.findOne({
  //       where: { id },
  //       relations: ['detail', 'director', 'genres'],
  //     });
  //   } catch (error) {
  //     await qr.rollbackTransaction();
  //     throw error;
  //   } finally {
  //     await qr.release();
  //   }
  // }

  /* istanbul ignore next */
  async deleteMovie(id: number) {
    // return this.movieRepository
    //   .createQueryBuilder()
    //   .delete()
    //   .where('id = :id', { id })
    //   .execute();
  }

  async remove(id: number) {
    const movie = await this.prisma.movie.findUnique({
      where: {
        id,
      },
      include: {
        detail: true,
      },
    });
    // const movie = await this.movieRepository.findOne({
    //   where: { id },
    //   relations: ['detail'],
    // });
    if (!movie) {
      throw new NotFoundException('존재하지 않는 ID의 영화입니다');
    }

    await this.prisma.movie.delete({
      where: {
        id,
      },
    });
    // await this.deleteMovie(id);

    // await this.movieRepository.delete(id);

    await this.prisma.movieDetail.delete({
      where: {
        id: movie.detail.id,
      },
    });
    // await this.movieDetailRepository.delete(movie.detail.id);

    return id;
  }

  /* istanbul ignore next */
  async getLikedRecord(movieId: number, userId: number) {
    // return this.movieUserLikeRepository
    //   .createQueryBuilder('movieUserLike')
    //   .leftJoinAndSelect('movieUserLike.movie', 'movie')
    //   .leftJoinAndSelect('movieUserLike.user', 'user')
    //   .where('movie.id = :movieId', { movieId })
    //   .andWhere('user.id = :userId', { userId })
    //   .getOne();
  }

  async toggleMovieLike(movieId: number, userId: number, isLike: boolean) {
    // const movie = await this.movieRepository.findOne({
    //   where: { id: movieId },
    // });
    const movie = await this.prisma.movie.findUnique({
      where: {
        id: movieId,
      },
    });
    if (!movie) {
      throw new BadRequestException('존재하지 않는 영화입니다.');
    }

    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });
    // const user = await this.userRepository.findOne({
    //   where: { id: userId },
    // });
    if (!user) {
      throw new UnauthorizedException('존재하지 않는 사용자입니다.');
    }

    const likeRecord = await this.prisma.movieUserLike.findUnique({
      where: {
        movieId_userId: {
          movieId,
          userId,
        },
      },
    });
    // const likeRecord = await this.getLikedRecord(movieId, userId);

    if (likeRecord) {
      if (isLike === likeRecord.isLike) {
        await this.prisma.movieUserLike.delete({
          where: {
            movieId_userId: {
              movieId,
              userId,
            },
          },
        });
        // await this.movieUserLikeRepository.delete({ movie, user });
      } else {
        await this.prisma.movieUserLike.update({
          where: {
            movieId_userId: {
              movieId,
              userId,
            },
          },
          data: {
            isLike,
          },
        });
        // await this.movieUserLikeRepository.update({ movie, user }, { isLike });
      }
    } else {
      await this.prisma.movieUserLike.create({
        data: {
          movie: {
            connect: {
              id: movieId,
            },
          },
          user: {
            connect: {
              id: userId,
            },
          },
          isLike,
        },
      });
      // await this.movieUserLikeRepository.save({
      //   movie,
      //   user,
      //   isLike,
      // });
    }

    const result = await this.prisma.movieUserLike.findUnique({
      where: {
        movieId_userId: {
          movieId,
          userId,
        },
      },
    });
    // const result = await this.getLikedRecord(movieId, userId);

    return {
      isLike: result && result.isLike, // result가 falsy면 result값 그대로 반환(Null), result가 truthy면 result.isLike값을 반환
    };
  }
}
