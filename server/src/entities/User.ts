import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany, Generated } from "typeorm";

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
}