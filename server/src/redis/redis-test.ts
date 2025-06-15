// 引入 RedisModule
import RedisModule from './redis.module';

/**
 * 测试 Redis 连接与基本读写
 */
async function testRedis() {
  // 获取 Redis 客户端实例
  const client = RedisModule.getClient();

  try {
    // 写入一个键值对
    await client.set('test-key', 'hello-redis');
    console.log('写入成功');

    // 读取该键的值
    const value = await client.get('test-key');
    console.log('读取到的值：', value);

    // 删除该键
    await client.del('test-key');
    console.log('删除成功');
  } catch (err) {
    console.error('Redis 测试出错：', err);
  } finally {
    // 关闭连接
    await client.quit();
  }
}

// 执行测试
testRedis();