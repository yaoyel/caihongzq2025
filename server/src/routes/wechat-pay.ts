import Router from '@koa/router';
import { customAlphabet } from "nanoid";
import WxPay from "wechatpay-node-v3";
import fs from "fs"; 
import { Context } from 'koa';
const dotenv = require("dotenv");
const path = require("path");

// 调用微信支付接口需要设置的变量
interface IWxPayConfig {
  WECHAT_APPID: string;
  WX_PAY_MCHID: string;
  PUBLIC_KEY: string;
  PRIVATE_KEY: string;
  WX_PAY_NOTIFY_URL: string;
}

// 调用微信支付接口需要的参数
interface IWxPayParams {
  description: string;
  out_trade_no: string;
  appid: string;
  notify_url: string;
  amount: {
    total: number;
  };
  payer: {
    openid: string;
  };
  scene_info: {
    payer_client_ip: string;
  };
}

// 微信支付回调通知的数据结构
interface IWxPayNotify {
  event_type: string;
  resource_type: string;
  resource: {
    ciphertext: string;
    associated_data: string;
    nonce: string;
    key: string;
  };
}

// 加载环境变量
const config = dotenv.config();
const payEnv = config.parsed as IWxPayConfig;

// 初始化微信支付实例
const pay = new WxPay({
  appid: payEnv.WECHAT_APPID,
  mchid: payEnv.WX_PAY_MCHID,
  publicKey: fs.readFileSync(path.resolve(__dirname, "../../pay_cert/apiclient_cert.pem")),
  privateKey: fs.readFileSync(path.resolve(__dirname, "..`/pay_cert/apiclient_key.pem")),
});
  
export function payRouter(): Router {
  const router = new Router({ prefix: '/api/pay' });

  // combine_transactions_jsapi
  router.get("/transactions_jsapi", async (ctx: Context) => {
    try {
      const { openid, amount } = ctx.query;
      
      if (!openid) throw new Error("The openid parameter is required.");
      if (!amount) throw new Error("The amount parameter is required.");

      const params: IWxPayParams = {
        description: "智愿逆袭",
        out_trade_no: customAlphabet("1234567890", 32)(),
        appid: payEnv.WECHAT_APPID,
        notify_url: payEnv.WX_PAY_NOTIFY_URL,
        amount: {
          total: Number.parseInt(amount as string),
        },
        payer: {
          openid: openid as string,
        },
        scene_info: {
          payer_client_ip: ctx.ip,
        },
      };
      
      const result = await pay.transactions_jsapi(params);
      ctx.status = 200;
      ctx.body = result;
    } catch (error) {
      console.error('支付接口调用失败:', error);
      ctx.status = 500;
      ctx.body = {
        code: 500,
        message: '支付接口调用失败',
        error: error instanceof Error ? error.message : '未知错误'
      };
    }
  });

  // 支付/退款 回调
  router.post("/notify", async (ctx: Context) => {
    try {
      console.log('收到支付回调:', ctx.request.body);
      const requestBody = ctx.request.body as IWxPayNotify;
      
      if (requestBody) {
        if (requestBody.event_type === "TRANSACTION.SUCCESS" && requestBody.resource_type === "encrypt-resource") {
          const { ciphertext, associated_data, nonce, key } = requestBody.resource;
          const result = pay.decipher_gcm(ciphertext, associated_data, nonce, key);
          ctx.status = 200;
          console.log('支付成功，解密后的数据:', result);
          // todo storeData
          ctx.body = {
            code: "SUCCESS",
            message: "成功"
          };
        } else {
          throw new Error("无效的回调请求");
        }
      }
    } catch (err: any) {
      console.error('支付回调处理失败:', err);
      ctx.status = 500;
      ctx.body = {
        code: "FAIL",
        message: err.message || "回调处理失败"
      };
    }
  });

  return router; 
}