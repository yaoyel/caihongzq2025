const fs = require('fs');
const path = require('path');

/**
 * 专科专业数据导入脚本
 * 将 zhuanke_major.json 文件中的数据转换为 SQL INSERT 语句
 */

// 定义输入输出路径
const inputFile = path.join(__dirname, '../src/entities/zhuanke_major.json');
const outputFile = path.join(__dirname, '../sql/insert_zhuanke_majors_data.sql');

// ID 映射表：将原始 MongoDB ObjectId 映射到自增长 ID
const idMap = new Map();
let currentId = 10000; // 从 10000 开始，避免与本科专业ID冲突

/**
 * 生成新的自增长 ID 并建立映射关系
 * @param {string} originalId 原始 MongoDB ObjectId
 * @returns {number} 新的自增长 ID
 */
function getNewId(originalId) {
  if (!originalId || originalId === '') {
    return null;
  }
  
  if (!idMap.has(originalId)) {
    idMap.set(originalId, currentId++);
  }
  
  return idMap.get(originalId);
}

/**
 * 递归解析专业数据
 * @param {Object} majorData 专业数据对象
 * @param {Array} results 结果数组
 */
function parseMajorData(majorData, results = []) {
  // 处理当前专业
  const major = {
    id: getNewId(majorData.id),
    name: majorData.name.replace(/'/g, "''"), // 转义单引号
    code: majorData.code,
    eduLevel: majorData.eduLevel || 'zhuan', // 专科层次
    level: majorData.level,
    parentId: getNewId(majorData.parentId) || null,
  };
  
  results.push(major);
  
  // 递归处理子专业
  if (majorData.majors && majorData.majors.length > 0) {
    majorData.majors.forEach(childMajor => {
      parseMajorData(childMajor, results);
    });
  }
  
  return results;
}

/**
 * 生成 SQL INSERT 语句
 * @param {Array} majors 专业数据数组
 * @returns {string} SQL INSERT 语句
 */
function generateInsertSQL(majors) {
  let sql = `-- 专科专业数据导入 SQL 脚本
-- 自动生成于: ${new Date().toLocaleString('zh-CN')}
-- 数据来源: zhuanke_major.json
-- 教育层次: 专科 (zhuan)

-- 插入专科专业数据（ID从10000开始，避免与本科专业冲突）
INSERT INTO majors (name, code, edu_level, level, parent_id) VALUES\n`;

  const values = majors.map(major => {
    const parentId = major.parentId ? major.parentId : 'NULL';
    return `  ('${major.name}', '${major.code}', '${major.eduLevel}', ${major.level}, ${parentId})`;
  });

  sql += values.join(',\n');
  sql += ';\n\n';

  // 添加数据统计信息
  sql += `-- 专科专业数据统计信息
-- 总记录数: ${majors.length}
-- 专业大类 (level=1): ${majors.filter(m => m.level === 1).length}
-- 专业类 (level=2): ${majors.filter(m => m.level === 2).length}
-- 具体专业 (level=3): ${majors.filter(m => m.level === 3).length}

-- 查询验证专科专业
-- SELECT edu_level, level, COUNT(*) as count FROM majors WHERE edu_level = 'zhuan' GROUP BY edu_level, level ORDER BY level;

-- 查询所有专业统计
-- SELECT edu_level, level, COUNT(*) as count FROM majors GROUP BY edu_level, level ORDER BY edu_level, level;
`;

  return sql;
}

/**
 * 主函数
 */
function main() {
  try {
    console.log('开始解析专科专业数据...');
    
    // 读取 JSON 文件
    const rawData = fs.readFileSync(inputFile, 'utf8');
    const jsonData = JSON.parse(rawData);
    
    console.log(`读取到 ${jsonData.result.length} 个专科专业大类`);
    
    // 解析所有专业数据
    const allMajors = [];
    jsonData.result.forEach(topLevelMajor => {
      parseMajorData(topLevelMajor, allMajors);
    });
    
    console.log(`共解析出 ${allMajors.length} 条专科专业记录`);
    console.log(`ID 映射关系: ${idMap.size} 条`);
    console.log(`ID 范围: ${Math.min(...Array.from(idMap.values()))} - ${Math.max(...Array.from(idMap.values()))}`);
    
    // 生成 SQL
    const insertSQL = generateInsertSQL(allMajors);
    
    // 写入文件
    fs.writeFileSync(outputFile, insertSQL, 'utf8');
    
    console.log(`SQL 文件已生成: ${outputFile}`);
    console.log('\n专科专业数据统计:');
    console.log(`- 专业大类 (level=1): ${allMajors.filter(m => m.level === 1).length}`);
    console.log(`- 专业类 (level=2): ${allMajors.filter(m => m.level === 2).length}`);
    console.log(`- 具体专业 (level=3): ${allMajors.filter(m => m.level === 3).length}`);
    
    // 输出前几条数据作为预览
    console.log('\n前 5 条专科专业数据预览:');
    allMajors.slice(0, 5).forEach((major, index) => {
      console.log(`${index + 1}. ${major.name} (${major.code}) - Level ${major.level} - ${major.eduLevel}`);
    });
    
  } catch (error) {
    console.error('处理过程中发生错误:', error.message);
    process.exit(1);
  }
}

// 运行主函数
if (require.main === module) {
  main();
}

module.exports = { parseMajorData, generateInsertSQL, getNewId }; 