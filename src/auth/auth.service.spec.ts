import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Role, User } from 'src/user/entity/user.entity';
import { UserService } from 'src/user/user.service';
import { Repository } from 'typeorm';
import { AuthService } from './auth.service';

const mockUserRepository = {
  findOne: jest.fn(),
};

const mockConfigService = {
  get: jest.fn(),
};

const mockJwtService = {
  signAsync: jest.fn(),
  verifyAsync: jest.fn(),
  decode: jest.fn(),
};

const mockCacheManager = {
  set: jest.fn(),
};

const mockUserSercvice = {
  create: jest.fn(),
};

describe('AuthService', () => {
  let authService: AuthService;
  let userRepository: Repository<User>;
  let configService: ConfigService;
  let jwtService: JwtService;
  let cacheManager: Cache;
  let userService: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
        {
          provide: UserService,
          useValue: mockUserSercvice,
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    configService = module.get<ConfigService>(ConfigService);
    jwtService = module.get<JwtService>(JwtService);
    cacheManager = module.get<Cache>(CACHE_MANAGER);
    userService = module.get<UserService>(UserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(authService).toBeDefined();
  });

  describe('blockToken', () => {
    it('should block a token', async () => {
      const token = 'token';
      const payload = {
        exp: Math.floor(Date.now() / 1000) + 60,
      };
      jest.spyOn(jwtService, 'decode').mockReturnValue(payload);
      await authService.blockToken(token);
      expect(jwtService.decode).toHaveBeenCalledWith(token);
      expect(mockCacheManager.set).toHaveBeenCalledWith(
        `BLOCK_TOKEN_${token}`,
        payload,
        expect.any(Number),
      );
    });
  });

  describe('parseBasicToken', () => {
    it('should parse a valid basic token', () => {
      const rawToken = 'Basic dGVzdEBleGFtcGxlLmNvbToxMjM0NTY='; // 'test@example.com:123456'
      const result = authService.parseBasicToken(rawToken);

      const decode = {
        email: 'test@example.com',
        password: '123456',
      };

      expect(result).toEqual(decode);
    });

    it('should throw an error for an invalid token format', () => {
      const rawToken = 'InvalidTokenFormat';
      expect(() => authService.parseBasicToken(rawToken)).toThrow(
        BadRequestException,
      );
    });

    it('should throw an error for an invalid basic token format', () => {
      const rawToken = 'Bearer InvalidBasicTokenFormat';
      expect(() => authService.parseBasicToken(rawToken)).toThrow(
        BadRequestException,
      );
    });

    it('should throw an error for an invalid basic token format', () => {
      const rawToken = 'Bearer a';
      expect(() => authService.parseBasicToken(rawToken)).toThrow(
        BadRequestException,
      );
    });
  });

  describe('parseBearerToeken', () => {
    it('should parse a valid bearer token', async () => {
      const rawToken = 'Bearer token';
      const payload = {
        type: 'access',
      };
      jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue(payload);
      jest.spyOn(mockConfigService, 'get').mockReturnValue('secret');

      const result = await authService.parseBearerToeken(rawToken, false);
      expect(jwtService.verifyAsync).toHaveBeenCalledWith('token', {
        secret: 'secret',
      });
      expect(result).toEqual(payload);
    });

    it('should throw a BadRequestException for an invalid bearer token format', async () => {
      const rawToken = 'a';
      await expect(
        authService.parseBearerToeken(rawToken, false),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw a BadRequestException for token not starting with Bearer', async () => {
      const rawToken = 'Basic a';
      await expect(
        authService.parseBearerToeken(rawToken, false),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw a UnauthorizedException if payload.type is not access but isRefreshToken parameter is false', async () => {
      const rawToken = 'Bearer a';

      jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue({
        type: 'refresh',
      });
      await expect(
        authService.parseBearerToeken(rawToken, false),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw a UnauthorizedException if payload.type is not refresh but isRefreshToken parameter is true', async () => {
      const rawToken = 'Bearer a';

      jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue({
        type: 'access',
      });
      await expect(
        authService.parseBearerToeken(rawToken, true),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('register', () => {
    it('should register a new user', async () => {
      const rawToken = 'Basic abcd=';
      const user = {
        email: 'test@example.com',
        password: '123456',
      };

      jest.spyOn(authService, 'parseBasicToken').mockReturnValue(user);
      jest.spyOn(mockUserSercvice, 'create').mockResolvedValue(user);
      const result = await authService.register(rawToken);
      expect(authService.parseBasicToken).toHaveBeenCalledWith(rawToken);
      expect(userService.create).toHaveBeenCalledWith(user);
      expect(result).toEqual(user);
    });
  });

  describe('authenticate', () => {
    it('should authenticate a user with correct credentials', async () => {
      const email = 'test@example.com';
      const password = '123456';
      const user = {
        email,
        password: 'hashedPassword',
      };

      jest.spyOn(mockUserRepository, 'findOne').mockResolvedValue(user);
      jest.spyOn(bcrypt, 'compare').mockImplementation((a, b) => true);

      const result = await authService.authenticate(email, password);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(password, 'hashedPassword');
      expect(result).toEqual(user);
    });

    it('should throw an error for not existing user', async () => {
      jest.spyOn(mockUserRepository, 'findOne').mockResolvedValue(null);
      expect(
        authService.authenticate('test@example.com', 'password'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw an error for incorrect password', async () => {
      const user = {
        email: 'test@example.com',
        password: 'hashedPassword',
      };
      jest.spyOn(mockUserRepository, 'findOne').mockResolvedValue(user);
      jest.spyOn(bcrypt, 'compare').mockImplementation((a, b) => false);
      expect(
        authService.authenticate('test@example.com', 'wrongPassword'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('issueToken', () => {
    const token = 'token';
    const user = {
      id: 1,
      role: Role.user,
    };
    beforeEach(() => {
      jest.spyOn(mockConfigService, 'get').mockReturnValue('secret');
      jest.spyOn(jwtService, 'signAsync').mockResolvedValue(token);
    });
    it('should issue an access token', async () => {
      const result = await authService.issueToken(user, false);
      expect(jwtService.signAsync).toHaveBeenCalledWith(
        {
          sub: user.id,
          role: user.role,
          type: 'access',
        },
        {
          secret: 'secret',
          expiresIn: 300,
        },
      );
      expect(result).toBe(token);
    });

    it('should issue an refresh token', async () => {
      const result = await authService.issueToken(user, true);
      expect(jwtService.signAsync).toHaveBeenCalledWith(
        {
          sub: user.id,
          role: user.role,
          type: 'refresh',
        },
        {
          secret: 'secret',
          expiresIn: '24h',
        },
      );
      expect(result).toBe(token);
    });
  });

  describe('login', () => {
    it('should login a user and return tokens', async () => {
      const rawToken = 'Basic abcd=';
      const email = 'test@example.com';
      const password = '123123';
      const user = {
        id: 1,
        role: Role.user,
      };
      jest
        .spyOn(authService, 'parseBasicToken')
        .mockReturnValue({ email, password });
      jest.spyOn(authService, 'authenticate').mockResolvedValue(user as User);
      jest.spyOn(authService, 'issueToken').mockResolvedValue('mocked.token');

      const result = await authService.login(rawToken);

      expect(authService.parseBasicToken).toHaveBeenCalledWith(rawToken);
      expect(authService.authenticate).toHaveBeenCalledWith(email, password);
      expect(authService.issueToken).toHaveBeenCalledWith(user, true);
      expect(authService.issueToken).toHaveBeenCalledTimes(2);
      expect(result).toEqual({
        refreshToken: 'mocked.token',
        accessToken: 'mocked.token',
      });
    });
  });
});
