import Router from '@koa/router';
import { Context } from 'koa';
import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';
import { AppDataSource } from '../data-source';
import { User } from '../entities/User';
import { generateRandomString, getAccessToken } from '../utils/helper';

// 微信接口返回数据类型定义
interface WechatQRCodeResponse {
  ticket: string;
  expire_seconds: number;
  url: string;
}

interface WechatUserInfo {
  subscribe: number;
  openid: string;
  nickname: string;
  sex: number;
  language: string;
  city: string;
  province: string;
  country: string;
  headimgurl: string;
  subscribe_time: number;
  remark: string;
  groupid: number;
  subscribe_scene: string;
  qr_scene: number;
  qr_scene_str: string;
}

interface WechatCallbackBody {
  FromUserName: string;
  ToUserName: string;
  CreateTime: number;
  MsgType: string;
  Event: string;
  EventKey: string;
}

const router = new Router({ prefix: '/api/wechat' });
const userRepository = AppDataSource.getRepository(User);

// 存储scene和用户信息的映射
const sceneMap = new Map<string, any>();

// 存储已处理的事件，防止重复处理
const processedEvents = new Map<string, number>();

// 获取登录二维码
router.get('/qrcode', async (ctx: Context) => {
  try {
    const sceneStr = generateRandomString(32);
    let responseData;
    
    try {
      // 尝试使用正式公众号接口
      const accessToken = await getAccessToken();
      const response = await axios.post<WechatQRCodeResponse>(
        `https://api.weixin.qq.com/cgi-bin/qrcode/create?access_token=${accessToken}`,
        {
          expire_seconds: 600,
          action_name: 'QR_STR_SCENE',
          action_info: {
            scene: {
              scene_str: sceneStr
            }
          }
        }
      );

      console.log('微信返回的二维码数据:', response.data);

      if (!response.data || !response.data.ticket) {
        throw new Error('获取二维码失败：无效的响应数据');
      }

      // 使用ticket换取二维码URL
      const qrCodeUrl = `https://mp.weixin.qq.com/cgi-bin/showqrcode?ticket=${encodeURIComponent(response.data.ticket)}`;
      
      responseData = {
        ticket: response.data.ticket,
        sceneStr: sceneStr,
        qrUrl: qrCodeUrl,
        isTest: false,
        expire_seconds: response.data.expire_seconds
      };
    } catch (error: any) {
      // 如果是未认证错误，使用测试号方案
      if (error.response?.data?.errcode === 48001) {
        console.log('使用测试号方案');
        // 使用测试号的参数化二维码接口
        const testQrCodeUrl = `https://mp.weixin.qq.com/debug/cgi-bin/qrcode?token=${process.env.WECHAT_TOKEN}&scene_str=${sceneStr}`;
        
        responseData = {
          ticket: 'test_ticket',
          sceneStr: sceneStr,
          qrUrl: testQrCodeUrl,
          isTest: true,
          expire_seconds: 600
        };
      } else {
        throw error;
      }
    }

    // 存储场景值
    sceneMap.set(sceneStr, { 
      created: Date.now(),
      isTest: responseData.isTest
    });

    console.log('返回给前端的数据:', responseData);
    ctx.body = responseData;
  } catch (error: any) {
    console.error('获取二维码失败:', error.response?.data || error.message);
    ctx.status = 500;
    ctx.body = { 
      error: '获取二维码失败',
      message: error.response?.data?.errmsg || error.message
    };
  }
});

// 微信回调接口 - 同时处理GET和POST请求
router.all('/callback', async (ctx: Context) => {
  console.log('收到微信请求:', {
    method: ctx.method,
    query: ctx.query,
    body: ctx.request.body,
    rawBody: ctx.request.rawBody
  });

  // 处理GET请求（服务器验证）
  if (ctx.method === 'GET') {
    const { signature, timestamp, nonce, echostr } = ctx.query;
    
    if (echostr) {
      console.log('收到微信验证请求');
      ctx.body = echostr;
    } else {
      ctx.status = 400;
      ctx.body = { error: '缺少 echostr 参数' };
    }
    return;
  }

  // 处理POST请求（事件推送）
  if (ctx.method === 'POST') {
    try {
      // 解析XML消息
      const xmlParser = new XMLParser({
        ignoreAttributes: true,
        parseTagValue: true
      });
      
      // 获取原始XML数据
      const xmlData = ctx.request.rawBody || '';
      console.log('收到的原始XML数据:', xmlData);
      
      // 解析XML
      const result = xmlParser.parse(xmlData);
      const message = result.xml;
      console.log('解析后的消息数据:', message);

      if (!message) {
        throw new Error('无法解析消息数据');
      }

      const { FromUserName, Event, EventKey, CreateTime } = message;

      // 检查是否是重复事件
      const eventKey = `${FromUserName}:${Event}:${EventKey}`;
      const lastProcessTime = processedEvents.get(eventKey);
      
      if (lastProcessTime && CreateTime - lastProcessTime < 5) {
        console.log('忽略重复事件:', {
          eventKey,
          lastProcessTime,
          currentTime: CreateTime
        });
        ctx.body = 'success';
        return;
      }

      // 更新事件处理时间
      processedEvents.set(eventKey, CreateTime);

      // 清理旧的事件记录
      const now = Date.now() / 1000;
      for (const [key, time] of processedEvents.entries()) {
        if (now - time > 60) { // 清理1分钟前的记录
          processedEvents.delete(key);
        }
      }

      // 只处理扫码事件
      if (Event !== 'SCAN' && Event !== 'subscribe') {
        console.log('非扫码事件，忽略处理:', Event);
        ctx.body = 'success';
        return;
      }

      // 处理场景值，subscribe 事件的 EventKey 带有 qrscene_ 前缀
      const sceneStr = Event === 'subscribe' ? EventKey.replace('qrscene_', '') : EventKey;
      console.log('处理场景值:', { 
        Event, 
        EventKey, 
        sceneStr,
        isNewSubscribe: Event === 'subscribe'
      });
      
      if (sceneMap.has(sceneStr)) {
        try {
          // 获取用户信息
          const accessToken = await getAccessToken();
          const userInfo = await axios.get<WechatUserInfo>(
            `https://api.weixin.qq.com/cgi-bin/user/info?access_token=${accessToken}&openid=${FromUserName}`
          );

          console.log('获取到用户信息:', userInfo.data);

          // 保存或更新用户信息
          let user = await userRepository.findOne({ where: { openid: FromUserName } });
          
          if (!user) {
            user = new User();
            user.openid = FromUserName;
            console.log('创建新用户');
          } else {
            console.log('更新现有用户');
          }
          
          user.nickname = userInfo.data.nickname;
          user.avatarUrl = userInfo.data.headimgurl;
          await userRepository.save(user);

          console.log('用户信息已保存:', user);

          // 更新scene映射
          const sceneInfo = sceneMap.get(sceneStr);
          if (!sceneInfo.scanned) {
            sceneMap.set(sceneStr, {
              ...sceneInfo,
              user,
              scanned: true,
              scanTime: Date.now()
            });
            console.log('场景值首次扫描，更新映射:', sceneMap.get(sceneStr));
          } else {
            console.log('场景值已扫描，当前状态:', sceneMap.get(sceneStr));
          }
        } catch (error) {
          console.error('处理用户信息失败:', error);
        }
      } else {
        console.log('未找到对应的场景值:', sceneStr);
      }
    } catch (error) {
      console.error('处理消息失败:', error);
    }
  }

  // 返回 success 给微信服务器
  ctx.body = 'success';
});

// 检查登录状态
router.get('/check-login', async (ctx: Context) => {
  const { scene } = ctx.query;
  
  if (!scene || typeof scene !== 'string') {
    ctx.status = 400;
    ctx.body = { error: '参数错误' };
    return;
  }

  const sceneInfo = sceneMap.get(scene);
  
  if (!sceneInfo) {
    ctx.status = 404;
    ctx.body = { error: '二维码已过期' };
    return;
  }

  if (sceneInfo.scanned && sceneInfo.user) {
    // 登录成功后删除scene记录
    sceneMap.delete(scene);
    
    ctx.body = {
      success: true,
      user: {
        id: sceneInfo.user.id,
        nickname: sceneInfo.user.nickname,
        avatarUrl: sceneInfo.user.avatarUrl
      }
    };
  } else {
    ctx.body = { success: false };
  }
});

// 清理过期的scene记录
setInterval(() => {
  const now = Date.now();
  for (const [scene, info] of sceneMap.entries()) {
    if (now - info.created > 600000) { // 10分钟过期
      sceneMap.delete(scene);
    }
  }
}, 60000);

// 微信服务器验证接口
router.get('/check', async (ctx: Context) => {
  try {
    const { echostr } = ctx.query;
    
    if (echostr) {
      console.log('收到微信验证请求，echostr:', echostr);
      // 直接返回 echostr 给微信服务器
      ctx.body = echostr;
    } else {
      ctx.status = 400;
      ctx.body = { error: '缺少 echostr 参数' };
    }
  } catch (error) {
    console.error('微信验证接口错误:', error);
    ctx.status = 500;
    ctx.body = { error: '服务器内部错误' };
  }
});

export default router; 