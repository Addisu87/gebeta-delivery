import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateSearchDto } from './dto/create-search.dto';
import { UpdateSearchDto } from './dto/update-search.dto';
import { Repository } from 'typeorm';
import { Search } from './entities/search.entity';

@Injectable()
export class SearchService {
  constructor(
    @InjectRepository(Search)
    private readonly searchRepository: Repository<Search>,
  ) {}

  create(createSearchDto: CreateSearchDto) {
    const search = this.searchRepository.create({
      ...createSearchDto,
      resultCount: createSearchDto.resultCount ?? 0,
    });
    return this.searchRepository.save(search);
  }

  findAll() {
    return this.searchRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string) {
    const search = await this.searchRepository.findOne({ where: { id } });
    if (!search) throw new NotFoundException(`Search with id ${id} not found`);
    return search;
  }

  async update(id: string, updateSearchDto: UpdateSearchDto) {
    const search = await this.findOne(id);
    Object.assign(search, updateSearchDto);
    return this.searchRepository.save(search);
  }

  async remove(id: string) {
    const search = await this.findOne(id);
    await this.searchRepository.remove(search);
    return { message: 'Search removed successfully' };
  }
}
