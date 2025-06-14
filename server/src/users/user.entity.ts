import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, OneToMany } from 'typeorm';
import { Message } from '../messages/message.entity';
import { Exclude } from 'class-transformer';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  username: string;

  @Column()
  @Exclude()
  password: string;

  @Column({ nullable: true })
  displayName: string;

  @Column({ default: false })
  isOnline: boolean;

  @Column({ nullable: true })
  @Exclude()
  refreshToken: string;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => Message, message => message.user)
  messages: Message[];
}