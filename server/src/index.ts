import 'reflect-metadata';
import { createKoaServer } from 'routing-controllers';
import { AppDataSource } from './data-source';
import { UserController } from './controllers/UserController';
import { ElementController } from './controllers/ElementController';
import { ScaleController } from './controllers/ScaleController';
import { QuestionController } from './controllers/QuestionController';
import { ChatController } from './controllers/ChatController';

// 初始化数据库连接
AppDataSource.initialize()
  .then(() => {
    // 创建 Koa 应用
    const app = createKoaServer({
      cors: true,
      controllers: [
        UserController,
        ElementController,
        ScaleController,
        QuestionController,
        ChatController
      ],
      routePrefix: '/api'
    });

    // 启动服务器
    const port = 80;
    app.listen(port, () => {
      console.log(`服务器运行在 http://localhost:${port}`);
    });
  })
  .catch((error) => console.log('数据库连接失败:', error)); 