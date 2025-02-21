import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, Generated } from 'typeorm';
import { Scale } from './Scale';
import { User } from './User';

@Entity('scale_answers')
export class ScaleAnswer {
  @PrimaryGeneratedColumn()
  @Generated('increment')
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