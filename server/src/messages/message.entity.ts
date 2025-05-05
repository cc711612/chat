import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../users/user.entity';
import { Room } from '../rooms/room.entity';

@Entity()
export class Message {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('text')
  content: string;

  @CreateDateColumn()
  sentAt: Date;

  @ManyToOne(() => User, user => user.messages, { nullable: true })
  @JoinColumn()
  user: User;

  @ManyToOne(() => Room, room => room.messages)
  @JoinColumn()
  room: Room;
  
  @Column({ default: false })
  isSystem: boolean;
}