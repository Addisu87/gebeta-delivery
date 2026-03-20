import { ConflictException, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  saltOrRounds = 10;

  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {}

  async findByEmail(email: string): Promise<User | undefined> {
    return (
      (await this.userRepository.findOne({ where: { email } })) ?? undefined
    );
  }

  async findById(userId: number): Promise<User | undefined> {
    return (
      (await this.userRepository.findOne({ where: { id: userId } })) ??
      undefined
    );
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.findByEmail(createUserDto.email);

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(
      createUserDto.password,
      this.saltOrRounds,
    );

    const user = this.userRepository.create({
      ...createUserDto,
      email: createUserDto.email,
      firstName: createUserDto.firstName ?? '',
      lastName: createUserDto.lastName ?? '',
      password: hashedPassword,
    });
    try {
      return await this.userRepository.save(user);
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  findAll(): Promise<User[]> {
    return this.userRepository.find();
  }

  findOne(id: number): Promise<User | null> {
    return this.userRepository.findOne({ where: { id: id } });
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return this.userRepository.update(id, updateUserDto);
  }

  async remove(id: number): Promise<User | null> {
    const user = await this.userRepository.findOne({ where: { id: id } });
    if (user) {
      await this.userRepository.remove(user);
    }
    return user;
  }
}
