import { Test, TestingModule } from '@nestjs/testing';
import { DirectorController } from './director.controller';
import { DirectorService } from './director.service';
import { CreateDirectorDto } from './dto/create-director.dto';

const mockDirectorService = {
  findAll: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

describe('DirectorController', () => {
  let controller: DirectorController;
  let service: DirectorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DirectorController],
      providers: [
        {
          provide: DirectorService,
          useValue: mockDirectorService,
        },
      ],
    }).compile();
    controller = module.get<DirectorController>(DirectorController);
    service = module.get<DirectorService>(DirectorService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should call findAll method from DirectorService', async () => {
      const result = [{ id: 1, name: 'director1' }];
      jest.spyOn(mockDirectorService, 'findAll').mockResolvedValue(result);
      expect(controller.findAll()).resolves.toEqual(result);
      expect(mockDirectorService.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should call findOne method from DirectorService with correct ID', async () => {
      const result = { id: 1, name: 'director1' };
      jest.spyOn(mockDirectorService, 'findOne').mockResolvedValue(result);
      expect(controller.findOne(1)).resolves.toEqual(result);
      expect(mockDirectorService.findOne).toHaveBeenCalledWith(1);
    });
  });

  describe('create', () => {
    it('should call create method from DirectorService with correct DTO', async () => {
      const createDirectorDto = {
        name: 'director',
      };
      const result = { id: 1, name: 'director' };
      jest.spyOn(mockDirectorService, 'create').mockResolvedValue(result);
      expect(
        controller.create(createDirectorDto as CreateDirectorDto),
      ).resolves.toEqual(result);
      expect(mockDirectorService.create).toHaveBeenCalledWith(
        createDirectorDto,
      );
    });
  });

  describe('update', () => {
    it('should call update method from DirectorService with correct ID and DTO', async () => {
      const updateDirectorDto = {
        name: 'director2',
      };
      const result = { id: 1, name: 'director2' };
      jest.spyOn(mockDirectorService, 'update').mockResolvedValue(result);
      expect(controller.update(1, updateDirectorDto)).resolves.toEqual(result);
      expect(service.update).toHaveBeenCalledWith(1, updateDirectorDto);
    });
  });

  describe('remove', () => {
    it('should call remove method from DirectorService with correct ID', async () => {
      const result = 1;
      jest.spyOn(mockDirectorService, 'remove').mockResolvedValue(result);
      expect(controller.remove(1)).resolves.toEqual(result);
      expect(mockDirectorService.remove).toHaveBeenCalledWith(1);
    });
  });
});
