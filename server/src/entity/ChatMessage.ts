import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { ChatSession } from './ChatSession';

@Entity('chat_messages')
export class ChatMessage {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    sessionId: number;

    @Column({
        type: 'enum',
        enum: ['user', 'assistant']
    })
    role: 'user' | 'assistant';

    @Column('text')
    content: string;

    @CreateDateColumn()
    createdAt: Date;

    @ManyToOne(() => ChatSession, session => session.messages)
    session: ChatSession;
}