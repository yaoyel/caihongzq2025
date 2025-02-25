import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, JoinColumn } from 'typeorm';
import { DoubleEdgedScale } from './DoubleEdgedScale';
import { User } from './User';

@Entity('double_edged_answers')
export class DoubleEdgedAnswer {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ name: 'scale_id' })
  scaleId: number;

  @Column({ name: 'double_edged_id' })
  doubleEdgedId: number;

  @Column()
  score: number;

  @CreateDateColumn({ name: 'submitted_at' })
  submittedAt: Date;

  @ManyToOne(() => DoubleEdgedScale)
  @JoinColumn({ name: 'scale_id' })
  scale: DoubleEdgedScale;

  @ManyToOne(() => User)
  @JoinColumn({name:"user_id"})
  user: User;
}