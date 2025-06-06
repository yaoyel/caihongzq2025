import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, JoinColumn } from 'typeorm';
import { Scale } from './Scale';
import { User } from './User';

@Entity('scale_answers')
export class ScaleAnswer {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'scale_id' })
  scaleId: number;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ name: 'score' })
  score: number;

  @CreateDateColumn({ name: 'submitted_at' })
  submittedAt: Date;

  @ManyToOne(() => Scale)
  @JoinColumn({ name: 'scale_id' })
  scale: Scale;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
}