// 引入 redis 和 dotenv 包
import { createClient, RedisClientType } from 'redis';
import * as dotenv from 'dotenv';
import * as path from 'path';

// 加载 .env 文件中的环境变量
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
console.log('REDIS_MASTER_HOST:', process.env.REDIS_MASTER_HOST);
console.log('REDIS_MASTER_PORT:', process.env.REDIS_MASTER_PORT);
console.log('REDIS_PASSWORD:', process.env.REDIS_PASSWORD);
console.log('REDIS_DB:', process.env.REDIS_DB);
/**
 * Redis 客户端单例模块
 * 负责初始化并导出 Redis 客户端实例
 */
class RedisModule {
  // Redis 客户端实例
  private static client: RedisClientType | null = null;

  /**
   * 获取 Redis 客户端实例（单例模式）
   */
  public static getClient(): RedisClientType {
    if (!RedisModule.client) {
      // 创建 Redis 客户端，读取环境变量配置
      RedisModule.client = createClient({
        socket: {
          host: process.env.REDIS_MASTER_HOST, // Redis 主机地址
          port: Number(process.env.REDIS_MASTER_PORT), // Redis 端口
        },
        password: process.env.REDIS_PASSWORD, // Redis 密码
        database: Number(process.env.REDIS_DB), // Redis 数据库编号
      });

      // 监听错误事件，防止未捕获异常导致进程退出
      RedisModule.client.on('error', (err:any) => {
        console.error('Redis 连接错误：', err);
      });

      // 连接 Redis 服务器
      RedisModule.client.connect().then(() => {
        console.log('Redis 连接成功');
      }).catch((err:any) => {
        console.error('Redis 连接失败：', err);
      });
    }
    return RedisModule.client;
  }
}

// 导出 RedisModule 供其他模块使用
export default RedisModule;