import { Entity, PrimaryGeneratedColumn, Column,Generated } from 'typeorm';

@Entity('questions')
export class Question {
  @PrimaryGeneratedColumn()
  @Generated('increment')
  id: number;

  @Column('text')
  content: string;

  @Column()
  ageRange: '4-8' | '9-14' | '14+';
} 