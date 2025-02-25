import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class CreateDoubleEdgedTables1709716000000 implements MigrationInterface {
    name = 'CreateDoubleEdgedTables1709716000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 创建 double_edgeds_scales 表
        await queryRunner.createTable(new Table({
            name: "double_edgeds_scales",
            columns: [
                {
                    name: "id",
                    type: "int",
                    isPrimary: true,
                    isGenerated: true,
                    generationStrategy: "increment"
                },
                {
                    name: "dimension",
                    type: "varchar",
                },
                {
                    name: "double_edged_id",
                    type: "int",
                },
                {
                    name: "content",
                    type: "text",
                },
                {
                    name: "type",
                    type: "enum",
                    enum: [
                        'inner_state',
                        'associate_with_people',
                        'tackle_issues',
                        'face_choices',
                        'common_outcome',
                        'normal_state'
                    ]
                }
            ]
        }), true);

        // 创建 double_edged_answers 表
        await queryRunner.createTable(new Table({
            name: "double_edged_answers",
            columns: [
                {
                    name: "id",
                    type: "int",
                    isPrimary: true,
                    isGenerated: true,
                    generationStrategy: "increment"
                },
                {
                    name: "user_id",
                    type: "int",
                },
                {
                    name: "double_edged_id",
                    type: "int",
                },
                {
                    name: "score",
                    type: "int",
                },
                {
                    name: "submitted_at",
                    type: "timestamp",
                    default: "now()"
                }
            ]
        }), true);

        // 添加外键约束
        await queryRunner.createForeignKey("double_edgeds_scales", new TableForeignKey({
            columnNames: ["double_edged_id"],
            referencedColumnNames: ["id"],
            referencedTableName: "double_edged_infos",
            onDelete: "CASCADE"
        }));

        await queryRunner.createForeignKey("double_edged_answers", new TableForeignKey({
            columnNames: ["user_id"],
            referencedColumnNames: ["id"],
            referencedTableName: "users",
            onDelete: "CASCADE"
        }));

        await queryRunner.createForeignKey("double_edged_answers", new TableForeignKey({
            columnNames: ["double_edged_id"],
            referencedColumnNames: ["id"],
            referencedTableName: "double_edgeds_scales",
            onDelete: "CASCADE"
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // 删除外键约束
        const doubleEdgedsScalesTable = await queryRunner.getTable("double_edgeds_scales");
        const doubleEdgedAnswersTable = await queryRunner.getTable("double_edged_answers");
        
        if (doubleEdgedsScalesTable) {
            const foreignKeys = doubleEdgedsScalesTable.foreignKeys;
            for (const foreignKey of foreignKeys) {
                await queryRunner.dropForeignKey("double_edgeds_scales", foreignKey);
            }
        }

        if (doubleEdgedAnswersTable) {
            const foreignKeys = doubleEdgedAnswersTable.foreignKeys;
            for (const foreignKey of foreignKeys) {
                await queryRunner.dropForeignKey("double_edged_answers", foreignKey);
            }
        }

        // 删除表
        await queryRunner.dropTable("double_edged_answers");
        await queryRunner.dropTable("double_edgeds_scales");
    }
} 