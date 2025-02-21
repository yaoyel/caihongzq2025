import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { Scale } from './Scale';
import { User } from './User';

@Entity('scale_answers')
export class ScaleAnswer {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  scaleId: number;

  @Column()
  userId: number;

  @Column()
  score: number;

  @CreateDateColumn()
  submittedAt: Date;

  @ManyToOne(() => Scale)
  scale: Scale;

  @ManyToOne(() => User)
  user: User;
} 