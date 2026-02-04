import { Injectable, NotFoundException } from '@nestjs/common';
// import { InjectRepository } from '@nestjs/typeorm';
// import { Repository } from 'typeorm';
import { CreateGenreDto } from './dto/create-genre.dto';
import { UpdateGenreDto } from './dto/update-genre.dto';
// import { Genre } from './entity/genre.entity';
// import { PrismaService } from 'src/common/prisma.service';
import { InjectModel } from '@nestjs/mongoose';
import { Genre } from './schema/genre.schema';
import { Model } from 'mongoose';

@Injectable()
export class GenreService {
  constructor(
    // @InjectRepository(Genre)
    // private readonly genreRepository: Repository<Genre>,
    // private readonly prisma: PrismaService,
    @InjectModel(Genre.name)
    private readonly genreModel: Model<Genre>,
  ) {}

  async create(createGenreDto: CreateGenreDto) {
    const genre = await this.genreModel
      .findOne({ name: createGenreDto.name })
      .exec();
    // const genre = await this.prisma.genre.findUnique({
    //   where: { name: createGenreDto.name },
    // });
    // const genre = await this.genreRepository.findOne({
    //   where: { name: createGenreDto.name },
    // });
    if (genre) {
      throw new NotFoundException('존재하는 장르입니다.');
    }
    return await this.genreModel.create(createGenreDto);
    // return this.prisma.genre.create({ data: createGenreDto });
  }

  findAll() {
    return this.genreModel.find().exec();
    // return this.prisma.genre.findMany();
  }

  async findOne(id: string) {
    const genre = await this.genreModel.findById(id).exec();
    // const genre = await this.prisma.genre.findUnique({
    //   where: { id },
    // });
    if (!genre) {
      throw new NotFoundException('존재하지 않는 장르입니다.');
    }

    return genre;
  }

  async update(id: string, updateGenreDto: UpdateGenreDto) {
    const genre = await this.genreModel.findById(id).exec();
    // const genre = await this.prisma.genre.findUnique({
    //   where: { id },
    // });
    if (!genre) {
      throw new NotFoundException('존재하지 않는 장르입니다.');
    }
    await this.genreModel.findByIdAndUpdate(id, updateGenreDto).exec();
    // await this.prisma.genre.update({ where: { id }, data: updateGenreDto });

    const newGenre = await this.genreModel.findById(id).exec();
    // const newGenre = await this.prisma.genre.findUnique({
    //   where: { id },
    // });

    return newGenre;
  }

  async remove(id: string) {
    const genre = await this.genreModel.findById(id).exec();
    // const genre = await this.prisma.genre.findUnique({
    //   where: { id },
    // });
    if (!genre) {
      throw new NotFoundException('존재하지 않는 장르입니다.');
    }

    await this.genreModel.findByIdAndDelete(id).exec();
    // await this.prisma.genre.delete({ where: { id } });

    return id;
  }
}
