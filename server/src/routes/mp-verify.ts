import Router from '@koa/router';
import { Context } from 'koa';
import * as fs from 'fs';
import * as path from 'path';

/**
 * 微信 MP 验证文件路由
 * 用于处理微信公众号服务器验证文件的访问
 * 注意：此路由直接在根路径处理请求，不使用 /api 前缀
 */
const router = new Router({ prefix: '' }); // 显式设置前缀为空

// 处理微信验证文件的下载
router.get('/MP_verify_s4aW7Fr0j7gMb5cG.txt', async (ctx: Context) => {
  try {
    // 获取验证文件的绝对路径
    const filePath = path.join(__dirname, '../../MP_verify_s4aW7Fr0j7gMb5cG.txt');
    
    // 设置响应头
    ctx.set('Content-Type', 'text/plain');
    ctx.set('Content-Disposition', 'attachment; filename=MP_verify_s4aW7Fr0j7gMb5cG.txt');
    
    // 读取文件内容并返回
    ctx.body = fs.createReadStream(filePath);
  } catch (error) {
    console.error('读取微信验证文件失败:', error);
    ctx.status = 500;
    ctx.body = '文件读取失败';
  }
});

export default router; 