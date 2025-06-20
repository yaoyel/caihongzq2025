import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany, Generated } from "typeorm";
import { Order } from './Order';

@Entity("users")
export class User {
    @PrimaryGeneratedColumn()
    @Generated('increment')
    id: number;

    @Column({ length: 100, unique: true, name: 'openid' })
    openid: string; 

    @Column({ length: 100, nullable: true, name: 'nickname' })
    nickname: string;

    @Column({ nullable: true, name: 'avatar_url' })
    avatarUrl: string;

    @Column({ length: 100, unique: true, name: 'unionid', nullable: true })
    unionid?: string;

    @Column({ nullable: true, name: 'province_id', type: 'int' })
    provinceId?: number;

    @Column({ nullable: true, name: 'score', type: 'int' })
    score?: number;

    @Column({ nullable: true, name: 'preferred_subjects',length: 32 })
    preferredSubjects?: string; 

    @Column({ nullable: true, name: 'secondary_subjects',length: 32 })
    secondarySubjects?: string;

    @Column({ nullable: true, name: 'enroll_type',length: 32 })
    enrollType?: string;  

    @Column({ 
        type: "enum", 
        enum: ["child", "adult"], 
        default: "child",
        name: 'user_type'
    })
    userType: "child" | "adult";

    @Column({ nullable: true, name: 'age' })
    age: number;

    @Column({ nullable: true, name: 'gender' })
    gender: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    // 添加与订单的一对多关联
    @OneToMany(() => Order, order => order.user)
    orders: Order[];
}