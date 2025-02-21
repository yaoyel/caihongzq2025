import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, Generated } from 'typeorm';

@Entity('elements')
export class Element {
  @PrimaryGeneratedColumn()
  @Generated('increment')
  id: number;

  @Column()
  name: string;

  @Column()
  type: 'like' | 'talent';

  @Column()
  status: string;

  @Column()
  dimension: '看' | '听' | '说' | '记' | '想' | '做' | '运动';

  @Column({ nullable: true })
  correspondingElementId: number;

  @OneToOne(() => Element)
  @JoinColumn()
  correspondingElement: Element;
} 