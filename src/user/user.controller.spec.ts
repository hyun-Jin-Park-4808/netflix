import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

const mockUserService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

describe('UserController', () => {
  let userController: UserController;
  let userService: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    }).compile();
    userController = module.get<UserController>(UserController);
    userService = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(userController).toBeDefined();
  });

  describe('create', () => {
    it('shoud return correct value', async () => {
      const createUserDto: CreateUserDto = {
        email: 'user@example.com',
        password: 'password',
      };

      const user = {
        id: 1,
        ...createUserDto,
        password: 'hashedPassword',
      };

      jest.spyOn(mockUserService, 'create').mockResolvedValue(user);
      const result = await userController.create(createUserDto);

      expect(userService.create).toHaveBeenCalledWith(createUserDto);
      expect(result).toEqual(user);
    });
  });

  describe('findAll', () => {
    it('shoud return a list of users', async () => {
      const users = [
        {
          id: 1,
          email: 'user1@example.com',
        },
        {
          id: 2,
          email: 'user2@example.com',
        },
      ];

      jest.spyOn(mockUserService, 'findAll').mockResolvedValue(users);
      const result = await userController.findAll();

      expect(userService.findAll).toHaveBeenCalled();
      expect(result).toEqual(users);
    });
  });

  describe('findOne', () => {
    it('shoud return a single user', async () => {
      const user = {
        id: 1,
        email: 'user1@example.com',
      };

      jest.spyOn(mockUserService, 'findOne').mockResolvedValue(user);
      const result = await userController.findOne(1);

      expect(userService.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual(user);
    });
  });

    describe('update', () => {
    it('shoud return a updated user', async () => {
      const id = 1;
      const updateUserDto: UpdateUserDto = {
        email: 'user@example.com',
      };
      const user = {
        id: 1,
        ...updateUserDto,
      };

      jest.spyOn(mockUserService, 'update').mockResolvedValue(user);
      const result = await userController.update(1, updateUserDto);

      expect(userService.update).toHaveBeenCalledWith(1, updateUserDto);
      expect(result).toEqual(user);
    });
  });

    describe('remove', () => {
    it('shoud delete a single user', async () => {
      const id = 1;

      jest.spyOn(mockUserService, 'remove').mockResolvedValue(id);
      const result = await userController.remove(1);

      expect(userService.remove).toHaveBeenCalledWith(1);
      expect(result).toEqual(id);
    });
  });
});
