import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  async findOne(id: number): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { username } });
  }

  async create(user: Partial<User>): Promise<User> {
    if (!user.password) {
      throw new Error('Password is required');
    }

    // Hash the password before saving
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(user.password, salt);
    
    const newUser = this.usersRepository.create({
      ...user,
      password: hashedPassword,
    });
    
    return this.usersRepository.save(newUser);
  }

  async update(id: number, userData: Partial<User>): Promise<User | null> {
    await this.usersRepository.update(id, userData);
    return this.findOne(id);
  }

  async updateOnlineStatus(id: number, isOnline: boolean): Promise<User | null> {
    if (!id) {
      throw new Error('User id is required for updateOnlineStatus');
    }
    await this.usersRepository.update(id, { isOnline });
    return this.findOne(id);
  }

  async validateUser(username: string, password: string): Promise<User | null> {
    const user = await this.findByUsername(username);
    
    if (user && await bcrypt.compare(password, user.password)) {
      // Don't expose password
      const { password, ...result } = user;
      return result as User;
    }
    
    return null;
  }
}