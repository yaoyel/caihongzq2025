FROM node:22-alpine as builder

WORKDIR /app

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm install

# 复制源代码
COPY . .

# 构建项目
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html

# 使用轻量级镜像存储构建产物
FROM alpine:latest

WORKDIR /app

# 复制构建产物
COPY --from=builder /app/dist /app/dist
 

# 使用简单命令保持容器运行
CMD ["tail", "-f", "/dev/null"]