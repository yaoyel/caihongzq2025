import { Entity, PrimaryGeneratedColumn,OneToMany, Column, ManyToOne,JoinColumn } from 'typeorm';
import { Element } from './Element';
import { ScaleOption } from './ScaleOption';
import { ScaleAnswer } from './ScaleAnswer';

@Entity('scales')
export class Scale {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text', name: 'content' })
  content: string;

  @Column({ name: 'element_id' })
  elementId: number;
  @Column({ name: 'type' })
  type: 'like' | 'talent';
  @Column({ name: 'direction' })
  direction: 'positive' | 'negative' | '168';
  @Column({ name: 'dimension' })
  dimension: '看' | '听' | '说' | '记' | '想' | '做' | '运动';
  @ManyToOne(() => Element)
  @JoinColumn({ name: 'element_id' })
  element: Element;

  @OneToMany(() => ScaleOption, option => option.scale)
  options: ScaleOption[];

  @OneToMany(() => ScaleAnswer, answer => answer.scale)
  answers: ScaleAnswer[];
}