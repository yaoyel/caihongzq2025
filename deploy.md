# 创建项目目录
mkdir -p /opt/rbridge
cd /opt/rbridge

# 创建必要的子目录
mkdir -p {client,server,nginx,postgres-data,redis-data,logs}


# 1. 克隆项目（如果是从Git仓库）
git clone https://github.com/yaoyel/caihongzq2025.git .
git pull https://github.com/yaoyel/caihongzq2025 dev-168

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

# 只重新构建并重启 client 和 server
docker-compose up --build -d client server

# 或者只重新构建 client
docker-compose up --build -d client

# 或者只重新构建 server
docker-compose up --build -d server

# 查看各服务日志
docker-compose logs -f client  # 前端日志
docker-compose logs -f server  # 后端日志
docker-compose logs -f db      # 数据库日志
docker-compose logs -f nginx   # Nginx日志

# 重启单个服务
docker-compose restart server  # 重启后端
docker-compose restart client  # 重启前端

# 数据库备份
# docker exec rbridge-db pg_dump -U postgres rbridge > backup_$(date +%Y%m%d).sql
  docker exec rbridge-db pg_dump -U postgres caihongzq-8088 > backup_$(date +%Y%m%d).sql
# 数据库恢复
cat backup_20240101.sql | docker exec -i rbridge-db psql -U postgres rbridge

# Redis 备份和恢复
# Redis 备份（使用 redis-cli 的 SAVE 命令触发 RDB 快照）
docker exec rbridge-redis redis-cli -a ${REDIS_PASSWORD} SAVE

# 复制 Redis 备份文件到宿主机
docker cp rbridge-redis:/data/dump.rdb redis_backup_$(date +%Y%m%d).rdb

# Redis 恢复（将备份文件复制回容器）
docker cp redis_backup_20240101.rdb rbridge-redis:/data/dump.rdb
# 重启 Redis 容器以加载备份
docker-compose restart redis

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
# docker exec -it rbridge-db psql -U postgres -d rbridge
docker exec -it rbridge-db psql -U postgres -d caihongzq-8088


# 更新部署

## 重要说明
> 由于 docker-compose.yml 中 client 服务使用了命名卷 client-dist:/app/dist，卷内容不会因镜像重建而自动更新。为确保前端构建产物每次部署都能同步，请在重新部署前手动删除 client-dist 卷。

## 步骤

1. 停止并移除所有容器
   ```bash
   docker-compose down
   ```

2. 删除 client-dist 卷（确保前端产物能被新镜像覆盖）
   ```bash
   docker volume rm rbridge-client-dist
   ```

3. 重新构建并启动服务
   ```bash
   docker-compose up -d --build
   ```

4. 查看服务状态
   ```bash
   docker-compose ps
   ```

5. 查看日志
   ```bash
   docker-compose logs -f
   ```

> 如果你不想每次都手动删除卷，也可以将 client 的挂载方式改为本地目录挂载（开发环境推荐），如：
> ```yaml
> volumes:
>   - ./client/dist:/app/dist
> ```
> 这样每次本地构建后，产物会自动同步到容器。









# auzre上的服务器比较早，版本也不是docker官方支持的版本，按照的时候错误不断
Kali 安装 Docker 教程
1
2
3
在 Kali Linux 上安装和配置 Docker_kali安装docker-CSDN博客
https://blog.csdn.net/m0_53157282/article/details/133042812
kali下对Docker的详细安装_kali安装docker-CSDN博客
https://blog.csdn.net/weixin_46318141/article/details/121168812
https://www.cnblogs.com/lrui1/p/18353634
在 Kali Linux 上安装 Docker 可以为开发人员和系统管理员提供一个轻松的容器化环境。以下是详细的安装步骤：

更新系统和更换源

首先，确保你的系统是最新的，并备份重要文件。使用以下命令更新软件包列表并升级已安装的软件包：

sudo apt-get update
sudo apt-get upgrade
检查内核版本

Docker 要求操作系统的内核版本高于 3.10。使用以下命令检查当前的内核版本：

uname -r
安装 Docker

在 Kali Linux 上使用 apt-get 命令安装 Docker：

sudo apt-get install docker.io
启动 Docker

安装完成后，使用以下命令启动 Docker 服务：

sudo systemctl start docker
设置开机自启动

如果希望 Docker 在系统启动时自动启动，可以使用以下命令将其设置为开机自启动：

sudo systemctl enable docker
验证安装

要验证 Docker 是否成功安装，可以执行以下命令查看 Docker 的版本信息：

docker version
检查 Docker 服务状态

最后，使用以下命令检查 Docker 服务的运行状态：

sudo systemctl status docker.service
确保服务处于运行状态（绿色）。至此，你已成功在 Kali Linux 上安装和配置 Docker  

注意：Kali Linux 并非 Docker 官方支持的发行版，因此可能会遇到一些兼容性问题。如果在安装和配置过程中遇到任何问题，请参考 Docker 官方文档或在相关社区寻求帮助 

安装的版本解决Error response from daemon: Get "https://registry-1.docker.io/v2/": net/http: request canceled while waiting for connection (Client.Timeout exceeded while awaiting headers) 

sudo vi /etc/docker/daemon.json

添加已下内容

{
　　"registry-mirrors":
　　　　[
　　　　　　"https://docker.m.daocloud.io/",
　　　　　　"https://huecker.io/",
　　　　　　"https://dockerhub.timeweb.cloud",
　　　　　　"https://noohub.ru/",
　　　　　　"https://dockerproxy.com",
　　　　　　"https://docker.mirrors.ustc.edu.cn",
　　　　　　"https://docker.nju.edu.cn",
　　　　　　"https://xx4bwyg2.mirror.aliyuncs.com",
　　　　　　"http://f1361db2.m.daocloud.io",
　　　　　　"https://registry.docker-cn.com",
　　　　　　"http://hub-mirror.c.163.com",
　　　　　　"https://docker.mirrors.ustc.edu.cn"
　　　　]
}

 

修改完成后，重启 Docker 服务：
sudo systemctl daemon-reload
sudo systemctl restart docker








docker compose build 命令
 Docker 命令大全Docker 命令大全

docker compose build 命令用于根据 docker-compose.yml 文件中的定义，构建服务的镜像。

docker compose build 会从指定的 Dockerfile 或 build 上下文中构建镜像，并为所有服务准备好容器。

语法
docker compose build [OPTIONS] [SERVICE...]
SERVICE（可选）：指定要构建的服务名称。如果不指定，将为所有服务构建镜像。
OPTIONS 选项：

--no-cache：在构建过程中不使用缓存层，强制从头开始构建镜像。
--pull：始终尝试从注册表中拉取最新的基础镜像。
--build-arg：传递构建时的变量（类似于 Docker 的 --build-arg 选项）。
--progress：指定构建的进度样式（auto、plain、tty），影响显示的输出方式。
--parallel：并行构建多个服务镜像以提高速度。
--no-rm：构建失败时，保留中间容器（默认在成功或失败后都会删除中间容器）。
实例
1、为所有服务构建镜像

docker compose build
根据 docker-compose.yml 中的配置，为所有服务构建镜像。

2、构建特定服务的镜像

docker compose build web
仅为 web 服务构建镜像。

3、不使用缓存构建镜像

docker compose build --no-cache
强制 Docker 从头构建所有镜像，不使用之前构建的缓存层。

4、从最新基础镜像构建

docker compose build --pull
确保 Docker 拉取最新的基础镜像，而不是使用本地镜像。

5、传递构建变量

docker compose build --build-arg NODE_ENV=production
通过 --build-arg 传递构建时所需的变量，例如传递 NODE_ENV 环境变量。