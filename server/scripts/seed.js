const fs = require('fs').promises;
const path = require('path');
const { Pool } = require('pg');

// 数据库连接配置
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'rbridge',
  password: process.env.DB_PASSWORD || 'chrdwvr450G',
  port: process.env.DB_PORT || 5432,
});

const seedFiles = [
  'element.sql',
  'scale.sql', 
  'double_edged_infos.sql',  
  'double_edged_scales.sql',
  'quesetion.sql'
];

async function seed() {
  try {
    for (const file of seedFiles) {
      console.log(`Seeding ${file}...`);
      const sqlPath = path.join(__dirname, '../db', file);
      const sql = await fs.readFile(sqlPath, 'utf8');
      await pool.query(sql);
      console.log(`Successfully seeded ${file}`);
    }
    console.log('All seed files executed successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seed(); 