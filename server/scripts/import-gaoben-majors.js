const fs = require('fs');
const path = require('path');

/**
 * 高职本科专业数据导入脚本
 * 从gao_ben.json文件读取数据，生成SQL插入语句
 * ID从1838开始，紧跟专科专业后面
 */

console.log('开始导入高职本科专业数据，ID从1838开始...\n');

// 读取JSON数据文件
const jsonPath = path.join(__dirname, 'json/gao_ben.json');
if (!fs.existsSync(jsonPath)) {
  console.error('错误：找不到高职本科专业数据文件:', jsonPath);
  process.exit(1);
}

const rawData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
const data = rawData.result || rawData; // 处理JSON结构
console.log('已读取高职本科专业数据文件');

let sqlContent = `-- 高职本科专业数据导入 SQL 脚本
-- 自动生成于: ${new Date().toLocaleString('zh-CN')}
-- 数据来源: gao_ben.json
-- 教育层次: 高职本科 (gao_ben)

-- 插入高职本科专业数据（ID从1838开始，紧跟专科专业后面）
INSERT INTO majors (id, name, code, edu_level, level, parent_id) VALUES\n`;

const records = [];
let currentId = 1838; // 从1838开始

/**
 * 递归处理专业数据，生成SQL插入语句
 * @param {Array} items - 专业数据数组
 * @param {number} level - 当前层级
 * @param {number|null} parentId - 父级ID
 */
function processItems(items, level, parentId = null) {
  items.forEach(item => {
    const id = currentId++;
    const name = item.name.replace(/'/g, "''"); // 转义单引号
    const code = item.code;
    
    // 记录当前项的ID，用于子项的parent_id
    const thisItemId = id;
    
    records.push({
      id: id,
      name: name,
      code: code,
      edu_level: 'gao_ben',
      level: level,
      parent_id: parentId
    });
    
    console.log(`处理: ${name} (${code}) - ID: ${id}, Level: ${level}`);
    
    // 递归处理子项（高职本科专业使用majors字段）
    if (item.majors && item.majors.length > 0) {
      processItems(item.majors, level + 1, thisItemId);
    }
  });
}

// 开始处理数据
processItems(data, 1);

// 生成SQL语句
records.forEach((record, index) => {
  const parentIdStr = record.parent_id ? record.parent_id : 'NULL';
  const comma = index < records.length - 1 ? ',' : ';';
  
  sqlContent += `  (${record.id}, '${record.name}', '${record.code}', '${record.edu_level}', ${record.level}, ${parentIdStr})${comma}\n`;
});

// 添加统计信息
const level1Count = records.filter(r => r.level === 1).length;
const level2Count = records.filter(r => r.level === 2).length;
const level3Count = records.filter(r => r.level === 3).length;

sqlContent += `
-- 高职本科专业数据统计信息
-- 总记录数: ${records.length}
-- 专业大类 (level=1): ${level1Count}
-- 专业类 (level=2): ${level2Count}
-- 具体专业 (level=3): ${level3Count}

-- 查询验证高职本科专业
-- SELECT edu_level, level, COUNT(*) as count FROM majors WHERE edu_level = 'gao_ben' GROUP BY edu_level, level ORDER BY level;

-- 查询所有专业统计
-- SELECT edu_level, level, COUNT(*) as count FROM majors GROUP BY edu_level, level ORDER BY edu_level, level;
`;

// 写入SQL文件
const outputPath = path.join(__dirname, '../sql/insert_gaoben_majors_data.sql');
fs.writeFileSync(outputPath, sqlContent, 'utf8');

console.log(`\n✅ 高职本科专业SQL文件已生成: ${outputPath}`);
console.log(`📊 数据统计:`);
console.log(`   - 总记录数: ${records.length}`);
console.log(`   - 专业大类 (level=1): ${level1Count}`);
console.log(`   - 专业类 (level=2): ${level2Count}`);
console.log(`   - 具体专业 (level=3): ${level3Count}`);
console.log(`   - ID范围: ${records[0].id} - ${records[records.length - 1].id}`);

console.log('\n✅ 高职本科专业数据导入脚本生成完成！'); 