import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, Generated } from 'typeorm';
import { Element } from './Element';

@Entity('scales')
export class Scale {
  @PrimaryGeneratedColumn()
  @Generated('increment')
  id: number;

  @Column('text')
  content: string;

  @Column()
  elementId: number;

  @Column()
  type: 'like' | 'talent';

  @Column()
  direction: 'positive' | 'negative';

  @Column()
  dimension: '看' | '听' | '说' | '记' | '想' | '做' | '运动';

  @ManyToOne(() => Element)
  element: Element;
} 