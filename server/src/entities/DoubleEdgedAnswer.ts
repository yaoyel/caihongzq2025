import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, JoinColumn } from 'typeorm';
import { DoubleEdged } from './DoubleEdged';
import { User } from './User';

@Entity('double_edged_answers')
export class DoubleEdgedAnswer {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ name: 'double_edged_id' })
  doubleEdgedId: number;

  @Column({ name: 'score' })
  score: number;

  @CreateDateColumn({ name: 'submitted_at' })
  submittedAt: Date;

  @ManyToOne(() => DoubleEdged)
  doubleEdged: DoubleEdged;

  @ManyToOne(() => User)
  @JoinColumn({name:"user_id"})
  user: User;
}