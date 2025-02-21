import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, Generated } from 'typeorm';
import { Question } from './Question';
import { User } from './User';

@Entity('question_answers')
export class QuestionAnswer {
  @PrimaryGeneratedColumn()
  @Generated('increment')
  id: number;

  @Column()
  userId: number;

  @Column()
  questionId: number;

  @Column('text')
  content: string;

  @CreateDateColumn()
  submittedAt: Date;

  @Column()
  submittedBy: string;

  @UpdateDateColumn()
  lastModifiedAt: Date;

  @ManyToOne(() => Question)
  question: Question;

  @ManyToOne(() => User)
  user: User;
} 