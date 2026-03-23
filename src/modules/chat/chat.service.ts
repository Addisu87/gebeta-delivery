import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateChatDto } from './dto/create-chat.dto';
import { UpdateChatDto } from './dto/update-chat.dto';
import { Repository } from 'typeorm';
import { Chat } from './entities/chat.entity';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Chat)
    private readonly chatRepository: Repository<Chat>,
  ) {}

  create(createChatDto: CreateChatDto) {
    const chat = this.chatRepository.create(createChatDto);
    return this.chatRepository.save(chat);
  }

  findAll() {
    return this.chatRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string) {
    const chat = await this.chatRepository.findOne({ where: { id } });
    if (!chat) throw new NotFoundException(`Chat with id ${id} not found`);
    return chat;
  }

  async update(id: string, updateChatDto: UpdateChatDto) {
    const chat = await this.findOne(id);
    Object.assign(chat, updateChatDto);
    return this.chatRepository.save(chat);
  }

  async remove(id: string) {
    const chat = await this.findOne(id);
    await this.chatRepository.remove(chat);
    return { message: 'Chat removed successfully' };
  }
}
