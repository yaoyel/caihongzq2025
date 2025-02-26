# 创建项目目录
mkdir -p /opt/rbridge
cd /opt/rbridge

# 创建必要的子目录
mkdir -p {client,server,nginx,postgres-data,logs}


# 1. 克隆项目（如果是从Git仓库）
git clone <repository-url> .

# 2. 创建环境配置文件
cp server/.env.example server/.env
# 编辑 .env 文件，填写必要的配置信息

# 3. 构建和启动服务
docker-compose up -d --build

# 4. 查看服务状态
docker-compose ps

# 5. 查看日志
docker-compose logs -f

# 进入后端容器
docker exec -it rbridge-server sh

# 运行数据库迁移
npm run migration:run

# 更新部署
git pull  # 拉取最新代码
docker-compose up -d --build  # 重新构建并启动

# 查看各服务日志
docker-compose logs -f client  # 前端日志
docker-compose logs -f server  # 后端日志
docker-compose logs -f db      # 数据库日志
docker-compose logs -f nginx   # Nginx日志

# 重启单个服务
docker-compose restart server  # 重启后端
docker-compose restart client  # 重启前端

# 数据库备份
docker exec rbridge-db pg_dump -U postgres rbridge > backup_$(date +%Y%m%d).sql

# 数据库恢复
cat backup_20240101.sql | docker exec -i rbridge-db psql -U postgres rbridge

# 检查容器状态
docker ps -a

# 查看容器日志
docker logs rbridge-server
docker logs rbridge-client

# 进入容器内部
docker exec -it rbridge-server sh
docker exec -it rbridge-client sh

# 检查网络连接
docker network inspect app-network

# 检查数据库连接
docker exec -it rbridge-db psql -U postgres -d rbridge