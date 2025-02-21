"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateChatTables1703664000000 = void 0;
class CreateChatTables1703664000000 {
    async up(queryRunner) {
        // 创建chat_sessions表
        await queryRunner.query(`
            CREATE TABLE chat_sessions (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                title VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                is_shared BOOLEAN DEFAULT FALSE,
                share_code VARCHAR(32)
            )
        `);
        // 创建chat_messages表
        await queryRunner.query(`
            CREATE TABLE chat_messages (
                id SERIAL PRIMARY KEY,
                session_id INTEGER NOT NULL,
                role VARCHAR(10) NOT NULL CHECK (role IN ('user', 'assistant')),
                content TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT fk_session
                    FOREIGN KEY (session_id)
                    REFERENCES chat_sessions(id)
                    ON DELETE CASCADE
            )
        `);
        // 添加索引
        await queryRunner.query(`CREATE INDEX idx_chat_sessions_user_id ON chat_sessions(user_id)`);
        await queryRunner.query(`CREATE INDEX idx_chat_sessions_share_code ON chat_sessions(share_code)`);
        await queryRunner.query(`CREATE INDEX idx_chat_messages_session_id ON chat_messages(session_id)`);
    }
    async down(queryRunner) {
        // 删除索引
        await queryRunner.query(`DROP INDEX IF EXISTS idx_chat_messages_session_id`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_chat_sessions_share_code`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_chat_sessions_user_id`);
        // 删除表
        await queryRunner.query(`DROP TABLE IF EXISTS chat_messages`);
        await queryRunner.query(`DROP TABLE IF EXISTS chat_sessions`);
    }
}
exports.CreateChatTables1703664000000 = CreateChatTables1703664000000;
//# sourceMappingURL=1703664000000-CreateChatTables.js.map