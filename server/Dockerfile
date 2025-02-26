FROM node:16-alpine as builder

WORKDIR /app

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm install

# 复制源代码
COPY . .

# 构建项目
RUN npm run build

# 运行阶段
FROM node:16-alpine

WORKDIR /app

# 仅复制必要文件
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY .env ./

EXPOSE 3000

CMD ["node", "dist/src/index.js"] 