import { Cache, CACHE_MANAGER, CacheModule } from '@nestjs/cache-manager';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonService } from 'src/common/common.service';
import { Director } from 'src/director/entity/director.entity';
import { Genre } from 'src/genre/entity/genre.entity';
import { User } from 'src/user/entity/user.entity';
import { DataSource } from 'typeorm';
import { MovieDetail } from './entity/movie-detail.entity';
import { MovieUserLike } from './entity/movie-user-like.entity';
import { Movie } from './entity/movie.entity';
import { MovieService } from './movie.service';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { NotFoundException } from '@nestjs/common';

describe('MovieService - Integration Test', () => {
  let service: MovieService;
  let cacheManager: Cache;
  let dataSource: DataSource;

  let users: User[];
  let movies: Movie[];
  let directors: Director[];
  let genres: Genre[];

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        CacheModule.register(),
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: 'localhost',
          port: 5433,
          username: 'postgres',
          password: 'password',
          database: 'test_db',
          entities: [Movie, MovieDetail, Director, Genre, User, MovieUserLike],
          dropSchema: true,
          synchronize: true,
          logging: false,
        }),
        TypeOrmModule.forFeature([
          Movie,
          MovieDetail,
          Director,
          Genre,
          User,
          MovieUserLike,
        ]),
      ],
      providers: [MovieService, CommonService],
    }).compile();

    service = module.get<MovieService>(MovieService);
    cacheManager = module.get<Cache>(CACHE_MANAGER);
    dataSource = module.get<DataSource>(DataSource);
    await dataSource.synchronize(true);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  beforeEach(async () => {
    await cacheManager.clear();

    const entities = dataSource.entityMetadatas;
    const tableNames = entities
      .map((entity) => `"${entity.tableName}"`)
      .join(', ');

    await dataSource.query(
      `TRUNCATE TABLE ${tableNames} RESTART IDENTITY CASCADE;`,
    );

    const movieRepository = dataSource.getRepository(Movie);
    const movieDetailRepository = dataSource.getRepository(MovieDetail);
    const userRepository = dataSource.getRepository(User);
    const directorRepository = dataSource.getRepository(Director);
    const genreRepository = dataSource.getRepository(Genre);

    users = [1, 2].map((x) =>
      userRepository.create({
        id: x,
        email: `test${x}@example.com`,
        password: '123456',
      }),
    );

    await userRepository.save(users);

    directors = [1, 2].map((x) =>
      directorRepository.create({
        id: x,
        dob: new Date('1922-11-11'),
        nationality: 'South Korea',
        name: `Director Name ${x}`,
      }),
    );

    await directorRepository.save(directors);

    genres = [1, 2].map((x) =>
      genreRepository.create({
        id: x,
        name: `Genre Name ${x}`,
      }),
    );

    await genreRepository.save(genres);

    movies = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((x) =>
      movieRepository.create({
        id: x,
        title: `Movie Title ${x}title`,
        director: directors[0],
        creator: users[0],
        likeCount: 0,
        dislikeCount: 0,
        detail: movieDetailRepository.create({
          detail: `Movie Detail ${x}`,
        }),
        movieFilePath: `movie/${x}.mp4`,
        genres: genres,
      }),
    );

    await movieRepository.save(movies);
  });

  describe('findRecent', () => {
    it('should return recent movies from cache', async () => {
      const result = (await service.findRecent()) as Movie[];
      const sortedResult = [...movies];
      sortedResult.sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
      );
      const sortedResultIds = sortedResult.slice(0, 10).map((x) => x.id);

      expect(result).toHaveLength(10);
      expect(result.map((x) => x.id)).toEqual(sortedResultIds);
    });

    it('should cache recent movies', async () => {
      const result = (await service.findRecent()) as Movie[];
      const cachedData = await (cacheManager as any).get('MOVIE_RECENT');

      expect(cachedData).toEqual(result);
    });
  });

  describe('findAll', () => {
    it('should return movies with correct titles', async () => {
      const dto = {
        title: 'Movie Title 1title',
        order: ['createdAt_DESC'],
        take: 10,
      };

      const result = await service.findAll(dto);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].title).toEqual(dto.title);
      expect(result.data[0]).not.toHaveProperty('likeStatus');
    });

    it('should return likeSTatus if userId is provided', async () => {
      const dto = {
        order: ['createdAt_DESC'],
        take: 10,
      };

      const result = await service.findAll(dto, users[0].id);

      expect(result.data).toHaveLength(10);
      expect(result.data[0]).toHaveProperty('likeStatus');
    });
  });

  describe('create', () => {
    beforeEach(() => {
      jest.spyOn(service, 'renameMovieFile').mockResolvedValue(null);
    });

    it('should create a movie', async () => {
      const createMovieDto: CreateMovieDto = {
        title: 'Movie Title 112121212',
        detail: 'Movie Detail 1112',
        directorId: directors[0].id,
        genreIds: genres.map((x) => x.id),
        movieFileName: 'movie.mp4',
      };

      const result = await service.create(
        createMovieDto,
        users[0].id,
        dataSource.createQueryRunner(),
      );

      expect(result.title).toBe(createMovieDto.title);
      expect(result.director.id).toBe(createMovieDto.directorId);
      expect(result.genres.map((x) => x.id)).toEqual(createMovieDto.genreIds);
      expect(result.detail.detail).toBe(createMovieDto.detail);
    });
  });

  describe('update', () => {
    it('should update a movie', async () => {
      const movieId = movies[0].id;

      const updateMovieDto: UpdateMovieDto = {
        title: 'Movie Title updated',
        detail: 'Movie Detail 22323',
        directorId: directors[1].id,
        genreIds: genres.map((x) => x.id),
      };

      const result = await service.update(movieId, updateMovieDto);
      expect(result.title).toBe(updateMovieDto.title);
      expect(result.detail.detail).toBe(updateMovieDto.detail);
      expect(result.director.id).toBe(updateMovieDto.directorId);
      expect(result.genres.map((x) => x.id)).toEqual(updateMovieDto.genreIds);
    });

    it('should throw NotFoundException if movie does not exist', async () => {
      const updateMovieDto: UpdateMovieDto = {
        title: 'Change',
      };
      await expect(service.update(100, updateMovieDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should remove a movie', async () => {
      const removeId = movies[0].id;
      const result = await service.remove(removeId);

      expect(result).toBe(removeId);
    });

    it('should throw NotFoundException if movie does not exist', async () => {
      await expect(service.remove(999999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('toggleMovieLike', () => {
    it('should create like correctly', async () => {
      const movieId = movies[0].id;
      const userId = users[0].id;

      const result = await service.toggleMovieLike(movieId, userId, true);

      expect(result).toEqual({ isLike: true });
    });

    it('should create dislike correctly', async () => {
      const movieId = movies[0].id;
      const userId = users[0].id;

      const result = await service.toggleMovieLike(movieId, userId, false);

      expect(result).toEqual({ isLike: false });
    });

    it('should toggle like correctly', async () => {
      const movieId = movies[0].id;
      const userId = users[0].id;

      await service.toggleMovieLike(movieId, userId, true);
      const result = await service.toggleMovieLike(movieId, userId, true);

      expect(result.isLike).toBeNull();
    });

    it('should toggle dislike correctly', async () => {
      const movieId = movies[0].id;
      const userId = users[0].id;

      await service.toggleMovieLike(movieId, userId, false);
      const result = await service.toggleMovieLike(movieId, userId, false);

      expect(result.isLike).toBeNull();
    });

    describe('findOne', () => {
      it('should return a movie if found', async () => {
        const movieId = movies[0].id;
        const result = await service.findOne(movieId);

        expect(result.id).toBe(movieId);
      });

      it('should throw NotFoundException if movie does not exist', async () => {
        const movieId = 999999;

        await expect(service.findOne(movieId)).rejects.toThrow(
          NotFoundException,
        );
      });
    });
  });
});
