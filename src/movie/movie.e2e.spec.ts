import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../app.module';
import { AuthService } from '../auth/auth.service';
import { Director } from '../director/entity/director.entity';
import { Genre } from '../genre/entity/genre.entity';
import { Role, User } from '../user/entity/user.entity';
import { MovieDetail } from './entity/movie-detail.entity';
import { Movie } from './entity/movie.entity';

describe('MovieController (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  let users: User[];
  let movies: Movie[];
  let directors: Director[];
  let genres: Genre[];
  let token: string;

  // 한 번만 실행
  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );
    await app.init();

    dataSource = app.get<DataSource>(DataSource);

    const movieRepository = dataSource.getRepository(Movie);
    const movieDetailRepository = dataSource.getRepository(MovieDetail);
    const userRepository = dataSource.getRepository(User);
    const directorRepository = dataSource.getRepository(Director);
    const genreRepository = dataSource.getRepository(Genre);

    await dataSource.query(`
      TRUNCATE TABLE 
        movie_user_like,
        movie_detail,
        movie,
        genre,
        director,
        "user" 
      RESTART IDENTITY CASCADE;
    `);

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
    const authService = moduleFixture.get<AuthService>(AuthService);
    token = await authService.issueToken(
      { id: users[0].id, role: Role.admin },
      false,
    );
  });

  afterAll(async () => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    await dataSource.destroy();
    await app.close();
  });

  describe('[GET] /movies', () => {
    it('should return all movies', async () => {
      const { body, statusCode, error } = await request(app.getHttpServer())
        .get('/movie')
        .expect(200);

      expect(statusCode).toBe(200);
      expect(body).toHaveProperty('data');
      expect(body).toHaveProperty('nextCursor');
      expect(body).toHaveProperty('count');

      expect(body.data).toHaveLength(5);
    });
  });

  describe('[GET] /movie/recent', () => {
    it('should return recent movies', async () => {
      const { body, statusCode } = await request(app.getHttpServer())
        .get('/movie/recent')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(statusCode).toBe(200);
      expect(body).toHaveLength(10);
    });
  });

  describe('[GET] /movie/:id', () => {
    it('should return a movie', async () => {
      const movieId = movies[0].id;
      const { body, statusCode } = await request(app.getHttpServer())
        .get(`/movie/${movieId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(statusCode).toBe(200);
      expect(body.id).toBe(movieId);
    });

    it('should throw NotFoundException if movie does not exist', async () => {
      const movieId = 999999;
      await request(app.getHttpServer())
        .get(`/movie/${movieId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });
  });

  describe('[POST] /movie', () => {
    it('should create a movie', async () => {
      // 보통 파일은 그냥 모킹함
      const {
        body: { fileName },
      } = await request(app.getHttpServer())
        .post('/common/video')
        .set('Authorization', `Bearer ${token}`)
        .attach('video', Buffer.from('test'), 'movie.mp4')
        .expect(201);

      const createMovieDto = {
        title: 'Test Movie 1',
        detail: 'Test Movie Detail 1',
        directorId: directors[0].id,
        genreIds: [genres[0].id],
        movieFileName: fileName,
      };

      const { body, statusCode } = await request(app.getHttpServer())
        .post('/movie')
        .set('Authorization', `Bearer ${token}`)
        .send(createMovieDto)
        .expect(201);

      expect(statusCode).toBe(201);
      expect(body).toBeDefined();
      expect(body.title).toBe(createMovieDto.title);
      expect(body.detail.detail).toBe(createMovieDto.detail);
      expect(body.director.id).toBe(createMovieDto.directorId);
      expect(body.genres.map((x) => x.id)).toEqual(createMovieDto.genreIds);
      expect(body.movieFilePath).toContain(fileName);
    });
  });

  describe('[PATCH] /movie/:id', () => {
    it('should update a movie', async () => {
      const movieId = movies[0].id;
      const updateMovieDto = {
        title: 'Movie Title updated',
        detail: 'Movie Detail 22323',
        directorId: directors[0].id,
        genreIds: [genres[0].id],
      };

      const { body, statusCode } = await request(app.getHttpServer())
        .patch(`/movie/${movieId}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateMovieDto);

      expect(statusCode).toBe(200);
      expect(body.title).toBe(updateMovieDto.title);
      expect(body.detail.detail).toBe(updateMovieDto.detail);
      expect(body.director.id).toBe(updateMovieDto.directorId);
      expect(body.genres.map((x) => x.id)).toEqual(updateMovieDto.genreIds);
    });
  });

  describe('[DELETE] /movie/:id', () => {
    it('should delete a movie', async () => {
      const movieId = movies[0].id;
      const { body, statusCode } = await request(app.getHttpServer())
        .delete(`/movie/${movieId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(statusCode).toBe(200);
    });

    it('should throw NotFoundException if movie does not exist', async () => {
      const movieId = 999999;
      await request(app.getHttpServer())
        .delete(`/movie/${movieId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });
  });

  describe('[POST] /movie/:id/like', () => {
    it('should like a movie', async () => {
      const movieId = movies[1].id;
      const { body, statusCode } = await request(app.getHttpServer())
        .post(`/movie/${movieId}/like`)
        .set('Authorization', `Bearer ${token}`);

      expect(statusCode).toBe(201);
      expect(body.isLike).toBe(true);
    });

    it('should cancel like a movie', async () => {
      const movieId = movies[1].id;
      const { body, statusCode } = await request(app.getHttpServer())
        .post(`/movie/${movieId}/like`)
        .set('Authorization', `Bearer ${token}`);

      expect(statusCode).toBe(201);
      expect(body.isLike).toBeNull();
    });
  });

  describe('[POST] /movie/:id/dislike', () => {
    it('should dislike a movie', async () => {
      const movieId = movies[1].id;
      const { body, statusCode } = await request(app.getHttpServer())
        .post(`/movie/${movieId}/dislike`)
        .set('Authorization', `Bearer ${token}`);

      expect(statusCode).toBe(201);
      expect(body.isLike).toBe(false);
    });

    it('should cancel dislike a movie', async () => {
      const movieId = movies[1].id;
      const { body, statusCode } = await request(app.getHttpServer())
        .post(`/movie/${movieId}/dislike`)
        .set('Authorization', `Bearer ${token}`);

      expect(statusCode).toBe(201);
      expect(body.isLike).toBeNull();
    });
  });
});
