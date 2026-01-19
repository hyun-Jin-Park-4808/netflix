import { Test, TestingModule } from '@nestjs/testing';
import { GenreController } from './genre.controller';
import { GenreService } from './genre.service';
import { CreateGenreDto } from './dto/create-genre.dto';
import { Genre } from './entity/genre.entity';

const mockGenreService = {
  findAll: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

describe('GenreController', () => {
  let controller: GenreController;
  let service: GenreService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GenreController],
      providers: [
        {
          provide: GenreService,
          useValue: mockGenreService,
        },
      ],
    }).compile();

    controller = module.get<GenreController>(GenreController);
    service = module.get<GenreService>(GenreService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call create method from GenreService with correct DTO', async () => {
      const createGenreDto = {
        name: 'Fantasy',
      };
      const result = { id: 1, ...createGenreDto };
      jest
        .spyOn(service, 'create')
        .mockResolvedValue(result as CreateGenreDto & Genre);
      expect(controller.create(createGenreDto)).resolves.toEqual(result);
      expect(mockGenreService.create).toHaveBeenCalledWith(createGenreDto);
    });
  });

  describe('findAll', () => {
    it('should call findAll method from GenreService and return an array of genres', async () => {
      const result = [{ id: 1, name: 'Fantasy' }];
      jest.spyOn(service, 'findAll').mockResolvedValue(result as Genre[]);
      expect(controller.findAll()).resolves.toEqual(result);
      expect(mockGenreService.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should call findOne method from GenreService with correct ID and return the genre', async () => {
      const id = 1;
      const result = { id: 1, name: 'Fantasy' };
      jest.spyOn(service, 'findOne').mockResolvedValue(result as Genre);
      expect(controller.findOne(id)).resolves.toEqual(result);
      expect(mockGenreService.findOne).toHaveBeenCalledWith(1);
    });
  });

  describe('update', () => {
    it('should call update method from GenreService with correct parametes and return updated genre', async () => {
      const id = 1;
      const updateGenreDto = {
        name: 'Updated Fantasy',
      };
      const result = { id, ...updateGenreDto };
      jest.spyOn(service, 'update').mockResolvedValue(result as Genre);
      expect(controller.update(1, updateGenreDto)).resolves.toEqual(result);
      expect(service.update).toHaveBeenCalledWith(id, updateGenreDto);
    });
  });

  describe('remove', () => {
    it('should call remove method from GenreService with correct ID and return id of the removed genre', async () => {
      const id = 1;
      jest.spyOn(service, 'remove').mockResolvedValue(id);
      expect(controller.remove(1)).resolves.toBe(id);
      expect(mockGenreService.remove).toHaveBeenCalledWith(1);
    });
  });
});
