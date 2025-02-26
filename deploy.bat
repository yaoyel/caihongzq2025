@echo off
echo Starting deployment process...

REM 检查 Docker 是否安装
where docker >nul 2>nul
if %errorlevel% neq 0 (
    echo Docker is not installed! Please install Docker Desktop for Windows first.
    echo Download from: https://www.docker.com/products/docker-desktop
    pause
    exit /b
)

REM 创建项目目录
set PROJECT_DIR=user-analysis
if not exist %PROJECT_DIR% mkdir %PROJECT_DIR%
cd %PROJECT_DIR%

echo Creating configuration files...

REM 创建 .env 文件
echo POSTGRES_USER=postgres> .env
echo POSTGRES_PASSWORD=chrdwvr450G>> .env
echo POSTGRES_DB=rbridge>> .env
echo DB_HOST=localhost>> .env
echo DB_PORT=5432>> .env

REM 创建 Dockerfile
echo FROM node:16-alpine as builder> Dockerfile
echo WORKDIR /app>> Dockerfile
echo COPY package*.json ./>> Dockerfile
echo RUN npm install>> Dockerfile
echo COPY . .>> Dockerfile
echo RUN npm run build>> Dockerfile
echo.>> Dockerfile
echo FROM node:16-alpine>> Dockerfile
echo WORKDIR /app>> Dockerfile
echo COPY --from=builder /app/dist ./dist>> Dockerfile
echo COPY --from=builder /app/package*.json ./>> Dockerfile
echo COPY --from=builder /app/node_modules ./node_modules>> Dockerfile
echo EXPOSE 3000>> Dockerfile
echo CMD ["node", "dist/src/index.js"]>> Dockerfile

REM 创建 docker-compose.yml
echo version: '3.8'> docker-compose.yml
echo.>> docker-compose.yml
echo services:>> docker-compose.yml
echo   app:>> docker-compose.yml
echo     build: .>> docker-compose.yml
echo     container_name: user-analysis-api>> docker-compose.yml
echo     restart: always>> docker-compose.yml
echo     ports:>> docker-compose.yml
echo       - "3000:3000">> docker-compose.yml
echo     environment:>> docker-compose.yml
echo       - NODE_ENV=production>> docker-compose.yml
echo       - DB_HOST=${DB_HOST}>> docker-compose.yml
echo       - DB_PORT=${DB_PORT}>> docker-compose.yml
echo       - DB_USER=${POSTGRES_USER}>> docker-compose.yml
echo       - DB_PASSWORD=${POSTGRES_PASSWORD}>> docker-compose.yml
echo       - DB_NAME=${POSTGRES_DB}>> docker-compose.yml
echo     depends_on:>> docker-compose.yml
echo       - db>> docker-compose.yml
echo     networks:>> docker-compose.yml
echo       - app-network>> docker-compose.yml
echo.>> docker-compose.yml
echo   db:>> docker-compose.yml
echo     image: postgres:14-alpine>> docker-compose.yml
echo     container_name: user-analysis-db>> docker-compose.yml
echo     restart: always>> docker-compose.yml
echo     environment:>> docker-compose.yml
echo       - POSTGRES_USER=${POSTGRES_USER}>> docker-compose.yml
echo       - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}>> docker-compose.yml
echo       - POSTGRES_DB=${POSTGRES_DB}>> docker-compose.yml
echo     volumes:>> docker-compose.yml
echo       - postgres-data:/var/lib/postgresql/data>> docker-compose.yml
echo     ports:>> docker-compose.yml
echo       - "5432:5432">> docker-compose.yml
echo     networks:>> docker-compose.yml
echo       - app-network>> docker-compose.yml
echo.>> docker-compose.yml
echo   nginx:>> docker-compose.yml
echo     image: nginx:alpine>> docker-compose.yml
echo     container_name: user-analysis-nginx>> docker-compose.yml
echo     restart: always>> docker-compose.yml
echo     ports:>> docker-compose.yml
echo       - "80:80">> docker-compose.yml
echo     volumes:>> docker-compose.yml
echo       - ./nginx.conf:/etc/nginx/conf.d/default.conf>> docker-compose.yml
echo     depends_on:>> docker-compose.yml
echo       - app>> docker-compose.yml
echo     networks:>> docker-compose.yml
echo       - app-network>> docker-compose.yml
echo.>> docker-compose.yml
echo networks:>> docker-compose.yml
echo   app-network:>> docker-compose.yml
echo     driver: bridge>> docker-compose.yml
echo.>> docker-compose.yml
echo volumes:>> docker-compose.yml
echo   postgres-data:>> docker-compose.yml

REM 创建 nginx.conf
echo server {> nginx.conf
echo     listen 80;>> nginx.conf
echo     server_name localhost;>> nginx.conf
echo.>> nginx.conf
echo     location /api/ {>> nginx.conf
echo         proxy_pass http://app:3000/;>> nginx.conf
echo         proxy_http_version 1.1;>> nginx.conf
echo         proxy_set_header Upgrade $http_upgrade;>> nginx.conf
echo         proxy_set_header Connection 'upgrade';>> nginx.conf
echo         proxy_set_header Host $host;>> nginx.conf
echo         proxy_cache_bypass $http_upgrade;>> nginx.conf
echo     }>> nginx.conf
echo }>> nginx.conf

REM 创建数据库备份脚本
echo @echo off> backup.bat
echo set TIMESTAMP=%%date:~-4%%%%date:~3,2%%%%date:~0,2%%>> backup.bat
echo set BACKUP_DIR=backups>> backup.bat
echo if not exist %%BACKUP_DIR%% mkdir %%BACKUP_DIR%%>> backup.bat
echo docker exec user-analysis-db pg_dump -U postgres user_analysis ^> %%BACKUP_DIR%%\backup_%%TIMESTAMP%%.sql>> backup.bat

echo Starting services...
docker-compose up -d

echo Waiting for services to start...
timeout /t 10 /nobreak

echo Checking service status...
docker-compose ps

echo Deployment completed!
echo Services are running at http://localhost
echo API service port: 3000
echo Database port: 5432

pause 