import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class CreateDoubleEdgedInfo1709715840000 implements MigrationInterface {
    name = 'CreateDoubleEdgedInfo1709715840000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(new Table({
            name: "double_edged_infos",
            columns: [
                {
                    name: "id",
                    type: "int",
                    isPrimary: true,
                    isGenerated: true,
                    generationStrategy: "increment"
                },
                {
                    name: "like_element_id",
                    type: "int",
                },
                {
                    name: "talent_element_id",
                    type: "int",
                },
                {
                    name: "name",
                    type: "varchar",
                },
                {
                    name: "demonstrate",
                    type: "text",
                },
                {
                    name: "affect",
                    type: "text",
                }
            ]
        }), true);

        // 添加外键约束
        await queryRunner.createForeignKey("double_edged_infos", new TableForeignKey({
            columnNames: ["like_element_id"],
            referencedColumnNames: ["id"],
            referencedTableName: "elements",
            onDelete: "CASCADE"
        }));

        await queryRunner.createForeignKey("double_edged_infos", new TableForeignKey({
            columnNames: ["talent_element_id"],
            referencedColumnNames: ["id"],
            referencedTableName: "elements",
            onDelete: "CASCADE"
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable("double_edged_infos");
        if (table) {
            const foreignKeys = table.foreignKeys;
            for (const foreignKey of foreignKeys) {
                await queryRunner.dropForeignKey("double_edged_infos", foreignKey);
            }
        }
        await queryRunner.dropTable("double_edged_infos");
    }
} 