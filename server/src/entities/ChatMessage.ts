import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { ChatSession } from './ChatSession';

@Entity('chat_messages')
export class ChatMessage {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ name: 'session_id' })
    sessionId!: number;

    @Column({
        type: 'enum',
        enum: ['user', 'assistant'],
        name: 'role'
    })
    role: 'user' | 'assistant';

    @Column({ type: 'text', name: 'content' })
    content: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @ManyToOne(() => ChatSession, session => session.messages)
    session: ChatSession;
}