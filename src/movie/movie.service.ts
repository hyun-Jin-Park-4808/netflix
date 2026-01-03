import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Director } from 'src/director/entity/director.entity';
import { Genre } from 'src/genre/entities/genre.entity';
import { DataSource, In, Repository } from 'typeorm';
import { createMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { MovieDetail } from './entities/movie-detail.entity';
import { Movie } from './entities/movie.entity';

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
    private readonly dataSource: DataSource,
  ) {}

  async findAll(title?: string) {
    const qb = await this.movieRepository
      .createQueryBuilder('movie')
      .leftJoinAndSelect('movie.director', 'director')
      .leftJoinAndSelect('movie.genres', 'genres');

    if (title) {
      qb.andWhere('movie.title LIKE :title', { title: `%${title}%` });
    }

    return await qb.getManyAndCount();
    // if (!title) {
    //   return [
    //     await this.movieRepository.find({
    //       relations: ['director', 'genres'],
    //     }),
    //     await this.movieRepository.count(),
    //   ];
    // }
    // return await this.movieRepository.findAndCount({
    //   where: {
    //     title: Like(`%${title}%`),
    //   },
    //   relations: ['director', 'genres'],
    // });
  }

  async findOne(id: number) {
    const movie = await this.movieRepository
      .createQueryBuilder('movie')
      .leftJoinAndSelect('movie.director', 'director')
      .leftJoinAndSelect('movie.genres', 'genres')
      .leftJoinAndSelect('movie.detail', 'detail')
      .where('movie.id = :id', { id })
      .getOne();
    // const movie = await this.movieRepository.findOne({
    //   where: { id },
    //   relations: ['detail', 'director', 'genres'],
    // });

    if (!movie) {
      throw new NotFoundException('존재하지 않는 영화입니다.');
    }
    return movie;
  }

  async create(createMovieDto: createMovieDto) {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();
    try {
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

      const movie = await qr.manager
        .createQueryBuilder()
        .insert()
        .into(Movie)
        .values({
          title: createMovieDto.title,
          detail: { id: movieDetailId }, // queryBuilder로는 다른 테이블에 동시에 데이터 만드는 건 안되고 따로 따로 만들고 연관관계만 넣어줄 수 있음.
          director,
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

      // const movie = await this.movieRepository.save({
      //   title: createMovieDto.title,
      //   genres,
      //   detail: {
      //     detail: createMovieDto.detail,
      //   },
      //   director,
      // });
      // return movie;

      await qr.commitTransaction();

      return await this.movieRepository.findOne({
        where: { id: movieId },
        relations: ['detail', 'director', 'genres'],
      });
    } catch (error) {
      await qr.rollbackTransaction();
      throw error;
    } finally {
      await qr.release();
    }
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
        // await this.movieDetailRepository.update(
        //   {
        //     id: movie.detail.id,
        //   },
        //   { detail },
        // );
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
        // await this.movieRepository.save(newMovie);
      }
      // const newMovie = await this.movieRepository.findOne({
      //   where: { id },
      //   relations: ['detail', 'director'],
      // });

      // newMovie.genres = newGenres;

      // await this.movieRepository.save(newMovie);

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
}
