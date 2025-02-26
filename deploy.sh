 #!/bin/bash

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}开始部署流程...${NC}"

# 检查 Docker 是否安装
if ! command -v docker &> /dev/null; then
    echo -e "${BLUE}安装 Docker...${NC}"
    curl -fsSL https://get.docker.com | sh
    sudo systemctl enable docker
    sudo systemctl start docker
fi

# 检查 Docker Compose 是否安装
if ! command -v docker-compose &> /dev/null; then
    echo -e "${BLUE}安装 Docker Compose...${NC}"
    sudo curl -L "https://github.com/docker/compose/releases/download/v2.18.1/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

# 创建项目目录
PROJECT_DIR="user-analysis"
mkdir -p $PROJECT_DIR
cd $PROJECT_DIR

echo -e "${BLUE}创建必要的配置文件...${NC}"

# 创建 .env 文件
cat > .env << EOL
DB_USER=user
DB_PASSWORD=password
DB_NAME=user_analysis
DB_ROOT_PASSWORD=root_password
EOL

# 创建 Dockerfile
cat > Dockerfile << EOL
FROM node:16-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:16-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3000
CMD ["node", "dist/src/index.js"]
EOL

# 创建 docker-compose.yml
cat > docker-compose.yml << EOL
version: '3.8'

services:
  app:
    build: .
    container_name: user-analysis-api
    restart: always
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DB_HOST=db
      - DB_PORT=3306
      - DB_USER=\${DB_USER}
      - DB_PASSWORD=\${DB_PASSWORD}
      - DB_NAME=\${DB_NAME}
    depends_on:
      - db
    networks:
      - app-network

  db:
    image: mysql:8.0
    container_name: user-analysis-db
    restart: always
    environment:
      - MYSQL_ROOT_PASSWORD=\${DB_ROOT_PASSWORD}
      - MYSQL_DATABASE=\${DB_NAME}
      - MYSQL_USER=\${DB_USER}
      - MYSQL_PASSWORD=\${DB_PASSWORD}
    volumes:
      - db-data:/var/lib/mysql
    networks:
      - app-network

  nginx:
    image: nginx:alpine
    container_name: user-analysis-nginx
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf
    depends_on:
      - app
    networks:
      - app-network

networks:
  app-network:
    driver: bridge

volumes:
  db-data:
EOL

# 创建 nginx.conf
cat > nginx.conf << EOL
server {
    listen 80;
    server_name localhost;

    location /api/ {
        proxy_pass http://app:3000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOL

# 创建备份脚本
cat > backup.sh << EOL
#!/bin/bash
DATE=\$(date +%Y%m%d)
BACKUP_DIR="/backup/mysql"
mkdir -p \$BACKUP_DIR
docker exec user-analysis-db mysqldump -u root -p\${DB_ROOT_PASSWORD} \${DB_NAME} > \$BACKUP_DIR/backup_\$DATE.sql
find \$BACKUP_DIR -type f -name "backup_*.sql" -mtime +30 -delete
EOL

chmod +x backup.sh

echo -e "${BLUE}启动服务...${NC}"
# 启动服务
docker-compose up -d

# 等待服务启动
echo -e "${BLUE}等待服务启动...${NC}"
sleep 10

# 检查服务状态
echo -e "${BLUE}检查服务状态...${NC}"
docker-compose ps

# 设置定时备份
echo -e "${BLUE}设置定时备份...${NC}"
(crontab -l 2>/dev/null; echo "0 2 * * * $(pwd)/backup.sh") | crontab -

echo -e "${GREEN}部署完成！${NC}"
echo -e "${GREEN}服务已启动在 http://localhost${NC}"
echo -e "${GREEN}API 服务端口: 3000${NC}"
echo -e "${GREEN}数据库端口: 3306${NC}"