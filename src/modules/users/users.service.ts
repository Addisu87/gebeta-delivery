import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { SALT_ROUNDS } from 'src/shared/constants';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

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
    this.logger.log(`Creating user for email=${createUserDto.email}`);
    const existingUser = await this.findByEmail(createUserDto.email);

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(
      createUserDto.password,
      SALT_ROUNDS,
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
      this.logger.error(
        `Failed to create user for email=${createUserDto.email}`,
        error instanceof Error ? error.stack : String(error),
      );
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
