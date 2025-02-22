import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

export type DoubleEdgedType = 
  | 'inner_state'
  | 'associate_with_people'
  | 'tackle_issues'
  | 'face_choices'
  | 'common_outcome'
  | 'normal_state';

@Entity('double_edgeds')
export class DoubleEdged {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  dimension: string;

  @Column({ name: 'like_element_id' })
  likeElementId: number;

  @Column({ name: 'talent_element_id' })
  talentElementId: number;

  @Column()
  content: string;

  @Column({
    type: 'enum',
    enum: [
      'inner_state',
      'associate_with_people',
      'tackle_issues', 
      'face_choices',
      'common_outcome',
      'normal_state'
    ]
  })
  type: DoubleEdgedType;
}