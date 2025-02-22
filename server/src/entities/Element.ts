import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, Generated } from 'typeorm';

@Entity('elements')
export class Element {
  @PrimaryGeneratedColumn()
  @Generated('increment')
  id: number;

  @Column({ name: 'name' })
  name: string;

  @Column({ name: 'type' })
  type: 'like' | 'talent';

  @Column({ name: 'status' })
  status: string;

  @Column({ name: 'dimension' })
  dimension: '看' | '听' | '说' | '记' | '想' | '做' | '运动';

  @Column({ nullable: true, name: 'corresponding_element_id' })
  correspondingElementId: number;

  @OneToOne(() => Element)
  @JoinColumn({ name: 'corresponding_element_id'})
  correspondingElement: Element;
}