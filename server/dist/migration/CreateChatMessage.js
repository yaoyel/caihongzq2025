"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateChatMessage = void 0;
const typeorm_1 = require("typeorm");
class CreateChatMessage {
    async up(queryRunner) {
        await queryRunner.createTable(new typeorm_1.Table({
            name: "chat_messages",
            columns: [
                {
                    name: "id",
                    type: "int",
                    isPrimary: true,
                    isGenerated: true,
                    generationStrategy: "increment"
                },
                {
                    name: "userId",
                    type: "int"
                },
                {
                    name: "content",
                    type: "text"
                },
                {
                    name: "isBot",
                    type: "boolean"
                },
                {
                    name: "createdAt",
                    type: "timestamp",
                    default: "now()"
                }
            ]
        }));
        await queryRunner.createForeignKey("chat_messages", new typeorm_1.TableForeignKey({
            columnNames: ["userId"],
            referencedColumnNames: ["id"],
            referencedTableName: "users",
            onDelete: "CASCADE"
        }));
    }
    async down(queryRunner) {
        await queryRunner.dropTable("chat_messages");
    }
}
exports.CreateChatMessage = CreateChatMessage;
//# sourceMappingURL=CreateChatMessage.js.map