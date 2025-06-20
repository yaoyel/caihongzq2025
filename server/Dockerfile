# 第一阶段：构建阶段
FROM node:22-alpine as builder
# 使用 node:22-alpine 作为基础镜像，alpine 是一个轻量级的 Linux 发行版
# 'as builder' 给这个阶段命名为 builder，用于多阶段构建

WORKDIR /app
# 设置工作目录为 /app

# 复制 package.json 和 package-lock.json
COPY package*.json ./
# 先只复制包管理文件，这样可以利用 Docker 的缓存机制
# 如果依赖没有变化，就不会重新安装

# 安装依赖
RUN npm install
# 安装项目所需的所有依赖

# 复制源代码和数据库文件
COPY . .
# 将当前目录下的所有文件复制到容器的 /app 目录

# 构建项目
RUN npm run build
# 执行构建命令，通常会将 TypeScript 代码编译成 JavaScript

# 第二阶段：运行阶段
FROM node:22-alpine
# 开始新的阶段，使用相同的基础镜像，但是是一个全新的环境

WORKDIR /app
# 设置工作目录

# 仅复制必要文件
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./ 
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/db ./db
COPY .env ./
COPY MP_verify_s4aW7Fr0j7gMb5cG.txt ./
COPY pay_cert ./pay_cert
# 从构建阶段复制必要的文件到运行阶段
# 只复制编译后的文件(dist)、依赖(node_modules)和数据库初始化文件
# 这样可以减小最终镜像的大小

# 添加数据库管理命令
RUN echo '#!/bin/sh' > /usr/local/bin/db-migration-run && \
    echo 'node ./node_modules/typeorm/cli.js migration:run -d dist/data-source.js' >> /usr/local/bin/db-migration-run && \
    chmod +x /usr/local/bin/db-migration-run && \
    \
    echo '#!/bin/sh' > /usr/local/bin/db-migration-revert && \
    echo 'node ./node_modules/typeorm/cli.js migration:revert -d dist/data-source.js' >> /usr/local/bin/db-migration-revert && \
    chmod +x /usr/local/bin/db-migration-revert && \
    \
    echo '#!/bin/sh' > /usr/local/bin/db-schema-sync && \
    echo 'node ./node_modules/typeorm/cli.js schema:sync -d dist/data-source.js' >> /usr/local/bin/db-schema-sync && \
    chmod +x /usr/local/bin/db-schema-sync && \
    \
    echo '#!/bin/sh' > /usr/local/bin/db-init && \
    echo 'db-schema-sync && node dist/scripts/seed.js' >> /usr/local/bin/db-init && \
    chmod +x /usr/local/bin/db-init

EXPOSE 3000
# 声明容器将监听的端口号

CMD ["node", "dist/index.js"]
# 容器启动时执行的命令，运行编译后的应用 