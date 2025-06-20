import Router from '@koa/router';
import { customAlphabet } from "nanoid";
import WxPay from "wechatpay-node-v3";
import fs from "fs"; 
import { Context } from 'koa';
const dotenv = require("dotenv");
const dotenvExpand = require("dotenv-expand");
const path = require("path");

// 调用微信支付接口需要设置的变量
interface IWxPayConfig {
  WX_OAUTH_APP_ID: string;
  WX_PAY_MCHID: string;
  PUBLIC_KEY: string;
  PRIVATE_KEY: string;
  WX_PAY_NOTIFY_URL: string;
}

// 调用微信支付接口需要的参数
interface IWxPayParams {
  description: string;
  out_trade_no: string;
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

const dotenvResult = dotenvExpand(dotenv.config());
const payEnv = dotenvResult.parsed as IWxPayConfig;

const pay = new WxPay({
  appid: payEnv.WX_OAUTH_APP_ID,
  mchid: payEnv.WX_PAY_MCHID,
  publicKey: fs.readFileSync(path.resolve(__dirname, "../pay_cert/apiclient_cert.pem")),
  privateKey: fs.readFileSync(path.resolve(__dirname, "../pay_cert/apiclient_key.pem")),
});
  
export function payRouter(): Router {
  const router = new Router({ prefix: '/api/wechat' });

  // combine_transactions_jsapi
  router.get("/pay/transactions_jsapi", async (ctx: Context) => {
    try {
      const { openid, amount } = ctx.query;
      
      if (!openid) throw new Error("The openid parameter is required.");
      if (!amount) throw new Error("The amount parameter is required.");

      const params: IWxPayParams = {
        description: "智愿逆袭",
        out_trade_no: customAlphabet("1234567890", 32)(),
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
      throw error;
    }
  });

  // 支付/退款 回调
  router.post("/pay/notify", async (ctx: Context) => {
    try {
      const requestBody = ctx.request.body as IWxPayNotify;
      
      if (requestBody) {
        console.log(requestBody);
        if (requestBody.event_type === "TRANSACTION.SUCCESS" && requestBody.resource_type === "encrypt-resource") {
          const { ciphertext, associated_data, nonce, key } = requestBody.resource;
          const result = pay.decipher_gcm(ciphertext, associated_data, nonce, key);
          ctx.status = 200;
          console.log(result);
          // todo storeData
        } else {
          throw new Error("Invalid request body");
        }
      }
    } catch (err: any) {
      console.log(err);
      throw err;
    }
  });

  return router; 
}