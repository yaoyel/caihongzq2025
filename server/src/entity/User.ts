import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany, Generated } from "typeorm";

@Entity("users")
export class User {
    @PrimaryGeneratedColumn()
    @Generated('increment')
    id: number;

    @Column({ length: 100, unique: true })
    openid: string;

    @Column({ length: 100, nullable: true })
    nickname: string;

    @Column({ nullable: true })
    avatarUrl: string;

    @Column({ 
        type: "enum", 
        enum: ["child", "adult"], 
        default: "child" 
    })
    userType: "child" | "adult";

    @Column({ nullable: true })
    age: number;

    @Column({ nullable: true })
    gender: string;

    @CreateDateColumn()
    createdAt: Date;

}