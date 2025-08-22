# 部署指南

本指南涵盖了将使用 hono-filebased-route 构建的应用程序部署到生产环境的部署策略、配置和最佳实践。

## 概述

部署基于文件路由的应用程序涉及几个关键考虑因素：

- 构建优化和资源准备
- 环境配置管理
- 容器编排（Docker/Kubernetes）
- CI/CD 流水线设置
- 监控和日志记录
- 安全加固
- 性能优化

## 构建过程

### 生产构建脚本

```json
// package.json
{
	"scripts": {
		"prebuild": "npm run clean && npm run generate-routes",
		"build": "tsc --build",
		"postbuild": "npm run copy-assets",
		"clean": "rimraf dist",
		"generate-routes": "tsx scripts/generate-routes.ts",
		"copy-assets": "copyfiles -u 1 'src/**/*.{json,yaml,yml}' dist/",
		"build:production": "NODE_ENV=production npm run build",
		"start:production": "NODE_ENV=production node dist/main.js"
	}
}
```

### 优化的 TypeScript 配置

```json
// tsconfig.production.json
{
	"extends": "./tsconfig.json",
	"compilerOptions": {
		"sourceMap": false,
		"removeComments": true,
		"declaration": false,
		"declarationMap": false,
		"incremental": false,
		"tsBuildInfoFile": null
	},
	"exclude": [
		"**/*.test.ts",
		"**/*.spec.ts",
		"scripts/**/*",
		"docs/**/*",
		"examples/**/*"
	]
}
```

### 构建优化脚本

```typescript
// scripts/build-production.ts
import { execSync } from 'child_process'
import fs from 'fs/promises'
import path from 'path'
import { performance } from 'perf_hooks'

interface BuildStats {
	buildTime: number
	bundleSize: number
	routeCount: number
	dependencies: number
}

async function buildProduction(): Promise<BuildStats> {
	const startTime = performance.now()

	console.log('🏗️  开始生产构建...')

	try {
		// 清理之前的构建
		console.log('🧹 清理之前的构建...')
		execSync('npm run clean', { stdio: 'inherit' })

		// 生成路由
		console.log('🛣️  生成路由...')
		execSync('npm run generate-routes', { stdio: 'inherit' })

		// 使用生产配置构建
		console.log('📦 构建应用程序...')
		execSync('tsc --project tsconfig.production.json', { stdio: 'inherit' })

		// 复制资源
		console.log('📋 复制资源...')
		execSync('npm run copy-assets', { stdio: 'inherit' })

		// 分析构建
		const stats = await analyzeBuild()
		const endTime = performance.now()

		stats.buildTime = endTime - startTime

		console.log('✅ 生产构建完成!')
		console.log(`📊 构建时间: ${(stats.buildTime / 1000).toFixed(2)}s`)
		console.log(`📦 包大小: ${(stats.bundleSize / 1024).toFixed(2)} KB`)
		console.log(`🛣️  路由数: ${stats.routeCount}`)
		console.log(`📚 依赖数: ${stats.dependencies}`)

		return stats
	} catch (error) {
		console.error('❌ 构建失败:', error)
		process.exit(1)
	}
}

async function analyzeBuild(): Promise<Omit<BuildStats, 'buildTime'>> {
	const distPath = path.join(process.cwd(), 'dist')

	// 计算包大小
	const bundleSize = await calculateDirectorySize(distPath)

	// 统计路由数
	const routesFile = path.join(distPath, 'generated-routes.js')
	const routesContent = await fs.readFile(routesFile, 'utf-8')
	const routeCount = (
		routesContent.match(/app\.(get|post|put|delete|patch)/g) || []
	).length

	// 统计依赖数
	const packageJson = JSON.parse(await fs.readFile('package.json', 'utf-8'))
	const dependencies = Object.keys({
		...packageJson.dependencies,
		...packageJson.devDependencies,
	}).length

	return {
		bundleSize,
		routeCount,
		dependencies,
	}
}

async function calculateDirectorySize(dirPath: string): Promise<number> {
	let totalSize = 0

	const items = await fs.readdir(dirPath, { withFileTypes: true })

	for (const item of items) {
		const itemPath = path.join(dirPath, item.name)

		if (item.isDirectory()) {
			totalSize += await calculateDirectorySize(itemPath)
		} else {
			const stats = await fs.stat(itemPath)
			totalSize += stats.size
		}
	}

	return totalSize
}

// 如果直接调用则运行构建
if (require.main === module) {
	buildProduction().catch(console.error)
}

export { buildProduction, type BuildStats }
```

## 环境配置

### 环境变量

```bash
# .env.production
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# 数据库
DATABASE_URL=postgresql://user:password@localhost:5432/myapp
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# Redis 缓存
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=your_redis_password

# 安全
JWT_SECRET=your_super_secret_jwt_key
CORS_ORIGIN=https://yourdomain.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# 监控
LOG_LEVEL=info
METRICS_ENABLED=true
HEALTH_CHECK_ENABLED=true

# 性能
CACHE_TTL=300
COMPRESSION_ENABLED=true
KEEP_ALIVE_TIMEOUT=65000
```

### 配置管理

```typescript
// src/config/index.ts
import { z } from 'zod'

const configSchema = z.object({
	// 服务器
	NODE_ENV: z
		.enum(['development', 'production', 'test'])
		.default('development'),
	PORT: z.coerce.number().default(3000),
	HOST: z.string().default('localhost'),

	// 数据库
	DATABASE_URL: z.string(),
	DATABASE_POOL_MIN: z.coerce.number().default(2),
	DATABASE_POOL_MAX: z.coerce.number().default(10),

	// 缓存
	REDIS_URL: z.string().optional(),
	REDIS_PASSWORD: z.string().optional(),
	CACHE_TTL: z.coerce.number().default(300),

	// 安全
	JWT_SECRET: z.string().min(32),
	CORS_ORIGIN: z.string().default('*'),
	RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000),
	RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(100),

	// 监控
	LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
	METRICS_ENABLED: z.coerce.boolean().default(false),
	HEALTH_CHECK_ENABLED: z.coerce.boolean().default(true),

	// 性能
	COMPRESSION_ENABLED: z.coerce.boolean().default(true),
	KEEP_ALIVE_TIMEOUT: z.coerce.number().default(65000),
})

function loadConfig() {
	try {
		const config = configSchema.parse(process.env)

		// 验证生产环境要求
		if (config.NODE_ENV === 'production') {
			if (config.JWT_SECRET.length < 32) {
				throw new Error('生产环境中 JWT_SECRET 必须至少32个字符')
			}

			if (config.CORS_ORIGIN === '*') {
				console.warn('⚠️  生产环境中 CORS_ORIGIN 设置为 "*"。考虑限制它。')
			}
		}

		return config
	} catch (error) {
		console.error('❌ 配置验证失败:')
		if (error instanceof z.ZodError) {
			error.errors.forEach((err) => {
				console.error(`  - ${err.path.join('.')}: ${err.message}`)
			})
		} else {
			console.error(error)
		}
		process.exit(1)
	}
}

export const config = loadConfig()
export type Config = z.infer<typeof configSchema>
```

## Docker 部署

### 多阶段 Dockerfile

```dockerfile
# Dockerfile
# 构建阶段
FROM node:18-alpine AS builder

WORKDIR /app

# 复制包文件
COPY package*.json ./
COPY tsconfig*.json ./

# 安装依赖
RUN npm ci --only=production --ignore-scripts

# 复制源代码
COPY src/ ./src/
COPY scripts/ ./scripts/

# 构建应用程序
RUN npm run build:production

# 生产阶段
FROM node:18-alpine AS production

# 创建非root用户
RUN addgroup -g 1001 -S nodejs
RUN adduser -S hono -u 1001

WORKDIR /app

# 复制构建的应用程序
COPY --from=builder --chown=hono:nodejs /app/dist ./dist
COPY --from=builder --chown=hono:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=hono:nodejs /app/package.json ./package.json

# 设置用户
USER hono

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# 启动应用程序
CMD ["npm", "run", "start:production"]
```

### 开发用 Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build:
      context: .
      target: production
    ports:
      - '3000:3000'
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:password@db:5432/myapp
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis
    restart: unless-stopped
    healthcheck:
      test: ['CMD', 'curl', '-f', 'http://localhost:3000/health']
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=myapp
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts/init-db.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - '5432:5432'
    restart: unless-stopped
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U postgres']
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    ports:
      - '6379:6379'
    restart: unless-stopped
    healthcheck:
      test: ['CMD', 'redis-cli', 'ping']
      interval: 10s
      timeout: 3s
      retries: 3

  nginx:
    image: nginx:alpine
    ports:
      - '80:80'
      - '443:443'
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - app
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

### 生产环境 Docker Compose

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  app:
    image: your-registry/hono-app:latest
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '1.0'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3
        window: 120s
    environment:
      - NODE_ENV=production
    env_file:
      - .env.production
    networks:
      - app-network
    logging:
      driver: 'json-file'
      options:
        max-size: '10m'
        max-file: '3'

  nginx:
    image: nginx:alpine
    ports:
      - '80:80'
      - '443:443'
    volumes:
      - ./nginx.prod.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
      - nginx_logs:/var/log/nginx
    depends_on:
      - app
    networks:
      - app-network
    restart: unless-stopped

networks:
  app-network:
    driver: overlay
    attachable: true

volumes:
  nginx_logs:
```

## Nginx 配置

### 生产环境 Nginx 配置

```nginx
# nginx.prod.conf
events {
    worker_connections 1024;
}

http {
    upstream app {
        least_conn;
        server app:3000 max_fails=3 fail_timeout=30s;
    }

    # 速率限制
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=1r/s;

    # 安全头
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;

    server {
        listen 80;
        server_name yourdomain.com www.yourdomain.com;
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name yourdomain.com www.yourdomain.com;

        # SSL 配置
        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
        ssl_prefer_server_ciphers off;
        ssl_session_cache shared:SSL:10m;
        ssl_session_timeout 10m;

        # 带速率限制的 API 路由
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            limit_req_status 429;

            proxy_pass http://app;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;

            # 超时设置
            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }

        # 更严格速率限制的登录端点
        location /api/auth/login {
            limit_req zone=login burst=5 nodelay;
            limit_req_status 429;

            proxy_pass http://app;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # 健康检查
        location /health {
            proxy_pass http://app;
            access_log off;
        }

        # 静态文件（如果有）
        location /static/ {
            expires 1y;
            add_header Cache-Control "public, immutable";
            try_files $uri =404;
        }

        # 错误页面
        error_page 404 /404.html;
        error_page 500 502 503 504 /50x.html;

        location = /50x.html {
            root /usr/share/nginx/html;
        }
    }
}
```

## CI/CD 流水线

### GitHub Actions 工作流

```yaml
# .github/workflows/deploy.yml
name: 部署到生产环境

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - name: 检出代码
        uses: actions/checkout@v4

      - name: 设置 Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: 安装依赖
        run: npm ci

      - name: 运行代码检查
        run: npm run lint

      - name: 运行类型检查
        run: npm run type-check

      - name: 运行测试
        run: npm test
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test

      - name: 运行构建
        run: npm run build:production

      - name: 上传构建产物
        uses: actions/upload-artifact@v4
        with:
          name: build-artifacts
          path: dist/

  security:
    runs-on: ubuntu-latest
    needs: test

    steps:
      - name: 检出代码
        uses: actions/checkout@v4

      - name: 运行安全审计
        run: npm audit --audit-level high

      - name: 运行 Snyk 安全扫描
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=high

  build-and-push:
    runs-on: ubuntu-latest
    needs: [test, security]
    if: github.ref == 'refs/heads/main'

    permissions:
      contents: read
      packages: write

    steps:
      - name: 检出代码
        uses: actions/checkout@v4

      - name: 登录容器注册表
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: 提取元数据
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=ref,event=branch
            type=ref,event=pr
            type=sha,prefix={{branch}}-
            type=raw,value=latest,enable={{is_default_branch}}

      - name: 构建并推送 Docker 镜像
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  deploy:
    runs-on: ubuntu-latest
    needs: build-and-push
    if: github.ref == 'refs/heads/main'

    environment:
      name: production
      url: https://yourdomain.com

    steps:
      - name: 检出代码
        uses: actions/checkout@v4

      - name: 部署到生产环境
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.PRODUCTION_HOST }}
          username: ${{ secrets.PRODUCTION_USER }}
          key: ${{ secrets.PRODUCTION_SSH_KEY }}
          script: |
            cd /opt/hono-app
            docker-compose -f docker-compose.prod.yml pull
            docker-compose -f docker-compose.prod.yml up -d
            docker system prune -f

      - name: 健康检查
        run: |
          sleep 30
          curl -f https://yourdomain.com/health || exit 1

      - name: 通知部署
        if: always()
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          channel: '#deployments'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

## Kubernetes 部署

### Kubernetes 清单

```yaml
# k8s/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: hono-app

---
# k8s/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: hono-config
  namespace: hono-app
data:
  NODE_ENV: 'production'
  PORT: '3000'
  LOG_LEVEL: 'info'
  METRICS_ENABLED: 'true'
  HEALTH_CHECK_ENABLED: 'true'

---
# k8s/secret.yaml
apiVersion: v1
kind: Secret
metadata:
  name: hono-secrets
  namespace: hono-app
type: Opaque
data:
  DATABASE_URL: <base64编码的数据库URL>
  JWT_SECRET: <base64编码的JWT密钥>
  REDIS_PASSWORD: <base64编码的Redis密码>

---
# k8s/deploy.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: hono-app
  namespace: hono-app
  labels:
    app: hono-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: hono-app
  template:
    metadata:
      labels:
        app: hono-app
    spec:
      containers:
        - name: hono-app
          image: ghcr.io/your-org/hono-app:latest
          ports:
            - containerPort: 3000
          envFrom:
            - configMapRef:
                name: hono-config
            - secretRef:
                name: hono-secrets
          resources:
            requests:
              memory: '256Mi'
              cpu: '250m'
            limits:
              memory: '512Mi'
              cpu: '500m'
          livenessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 30
            periodSeconds: 10
            timeoutSeconds: 5
            failureThreshold: 3
          readinessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 5
            timeoutSeconds: 3
            failureThreshold: 3
          securityContext:
            runAsNonRoot: true
            runAsUser: 1001
            allowPrivilegeEscalation: false
            readOnlyRootFilesystem: true
            capabilities:
              drop:
                - ALL

---
# k8s/service.yaml
apiVersion: v1
kind: Service
metadata:
  name: hono-service
  namespace: hono-app
spec:
  selector:
    app: hono-app
  ports:
    - protocol: TCP
      port: 80
      targetPort: 3000
  type: ClusterIP

---
# k8s/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: hono-ingress
  namespace: hono-app
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/rate-limit: '100'
    nginx.ingress.kubernetes.io/rate-limit-window: '1m'
spec:
  tls:
    - hosts:
        - yourdomain.com
      secretName: hono-tls
  rules:
    - host: yourdomain.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: hono-service
                port:
                  number: 80

---
# k8s/hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: hono-hpa
  namespace: hono-app
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: hono-app
  minReplicas: 3
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
```

## 监控和日志记录

### 健康检查端点

```typescript
// src/routes/health.ts
import type { Context } from 'hono'
import { config } from '../config'
import { dbPool } from '../utils/database'
import { cacheManager } from '../utils/cache'

interface HealthStatus {
	status: 'healthy' | 'unhealthy'
	timestamp: string
	uptime: number
	version: string
	checks: {
		database: 'up' | 'down'
		cache: 'up' | 'down'
		memory: 'ok' | 'warning' | 'critical'
	}
	metrics?: {
		memoryUsage: number
		cpuUsage: number
		activeConnections: number
		cacheHitRate: number
	}
}

export const GET = async (c: Context) => {
	const startTime = performance.now()

	try {
		// 检查数据库
		const dbStatus = await checkDatabase()

		// 检查缓存
		const cacheStatus = await checkCache()

		// 检查内存
		const memoryStatus = checkMemory()

		const health: HealthStatus = {
			status:
				dbStatus === 'up' && cacheStatus === 'up' && memoryStatus !== 'critical'
					? 'healthy'
					: 'unhealthy',
			timestamp: new Date().toISOString(),
			uptime: process.uptime(),
			version: process.env.npm_package_version || '1.0.0',
			checks: {
				database: dbStatus,
				cache: cacheStatus,
				memory: memoryStatus,
			},
		}

		// 如果启用，添加详细指标
		if (config.METRICS_ENABLED) {
			const memoryUsage = process.memoryUsage()
			const dbStats = dbPool.getStats()
			const cacheStats = cacheManager.getStats()

			health.metrics = {
				memoryUsage: Math.round(memoryUsage.heapUsed / 1024 / 1024),
				cpuUsage: process.cpuUsage().user / 1000000, // 转换为秒
				activeConnections: dbStats.total - dbStats.available,
				cacheHitRate: cacheStats.hitRate,
			}
		}

		const responseTime = performance.now() - startTime
		c.header('X-Response-Time', `${responseTime.toFixed(2)}ms`)

		const statusCode = health.status === 'healthy' ? 200 : 503
		return c.json(health, statusCode)
	} catch (error) {
		console.error('健康检查失败:', error)

		return c.json(
			{
				status: 'unhealthy',
				timestamp: new Date().toISOString(),
				error: '健康检查失败',
			},
			503
		)
	}
}

async function checkDatabase(): Promise<'up' | 'down'> {
	try {
		const connection = await dbPool.acquire()
		// 简单查询测试连接
		await connection.query('SELECT 1')
		dbPool.release(connection)
		return 'up'
	} catch {
		return 'down'
	}
}

async function checkCache(): Promise<'up' | 'down'> {
	try {
		await cacheManager.set('health-check', 'ok', 10)
		const result = await cacheManager.get('health-check')
		return result === 'ok' ? 'up' : 'down'
	} catch {
		return 'down'
	}
}

function checkMemory(): 'ok' | 'warning' | 'critical' {
	const usage = process.memoryUsage()
	const heapUsageRatio = usage.heapUsed / usage.heapTotal

	if (heapUsageRatio > 0.9) return 'critical'
	if (heapUsageRatio > 0.8) return 'warning'
	return 'ok'
}
```

### 结构化日志记录

```typescript
// src/utils/logger.ts
import { config } from '../config'

interface LogEntry {
	level: 'error' | 'warn' | 'info' | 'debug'
	message: string
	timestamp: string
	service: string
	version: string
	requestId?: string
	userId?: string
	metadata?: Record<string, any>
	error?: {
		name: string
		message: string
		stack?: string
	}
}

class Logger {
	private service: string
	private version: string
	private logLevel: number

	constructor() {
		this.service = 'hono-app'
		this.version = process.env.npm_package_version || '1.0.0'
		this.logLevel = this.getLogLevel(config.LOG_LEVEL)
	}

	private getLogLevel(level: string): number {
		const levels = { error: 0, warn: 1, info: 2, debug: 3 }
		return levels[level as keyof typeof levels] || 2
	}

	private shouldLog(level: string): boolean {
		return this.getLogLevel(level) <= this.logLevel
	}

	private createLogEntry(
		level: LogEntry['level'],
		message: string,
		metadata?: Record<string, any>,
		error?: Error
	): LogEntry {
		const entry: LogEntry = {
			level,
			message,
			timestamp: new Date().toISOString(),
			service: this.service,
			version: this.version,
		}

		if (metadata) {
			entry.metadata = metadata
			entry.requestId = metadata.requestId
			entry.userId = metadata.userId
		}

		if (error) {
			entry.error = {
				name: error.name,
				message: error.message,
				stack: config.NODE_ENV === 'development' ? error.stack : undefined,
			}
		}

		return entry
	}

	private output(entry: LogEntry) {
		if (config.NODE_ENV === 'production') {
			console.log(JSON.stringify(entry))
		} else {
			// 开发环境美化打印
			const timestamp = entry.timestamp.split('T')[1].split('.')[0]
			const level = entry.level.toUpperCase().padEnd(5)
			console.log(`${timestamp} ${level} ${entry.message}`)

			if (entry.metadata) {
				console.log('  元数据:', entry.metadata)
			}

			if (entry.error && entry.error.stack) {
				console.log('  堆栈:', entry.error.stack)
			}
		}
	}

	error(message: string, error?: Error, metadata?: Record<string, any>) {
		if (this.shouldLog('error')) {
			this.output(this.createLogEntry('error', message, metadata, error))
		}
	}

	warn(message: string, metadata?: Record<string, any>) {
		if (this.shouldLog('warn')) {
			this.output(this.createLogEntry('warn', message, metadata))
		}
	}

	info(message: string, metadata?: Record<string, any>) {
		if (this.shouldLog('info')) {
			this.output(this.createLogEntry('info', message, metadata))
		}
	}

	debug(message: string, metadata?: Record<string, any>) {
		if (this.shouldLog('debug')) {
			this.output(this.createLogEntry('debug', message, metadata))
		}
	}
}

export const logger = new Logger()
```

## 安全加固

### 安全中间件

```typescript
// src/middleware/security.ts
import type { Context } from 'hono'
import { config } from '../config'

// 速率限制存储
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

export function securityHeaders() {
	return async (c: Context, next: () => Promise<void>) => {
		// 安全头
		c.header('X-Content-Type-Options', 'nosniff')
		c.header('X-Frame-Options', 'DENY')
		c.header('X-XSS-Protection', '1; mode=block')
		c.header('Referrer-Policy', 'strict-origin-when-cross-origin')
		c.header('Permissions-Policy', 'geolocation=(), microphone=(), camera=()')

		if (config.NODE_ENV === 'production') {
			c.header(
				'Strict-Transport-Security',
				'max-age=31536000; includeSubDomains'
			)
		}

		await next()
	}
}

export function rateLimit(options: {
	windowMs: number
	maxRequests: number
	skipSuccessfulRequests?: boolean
}) {
	const { windowMs, maxRequests, skipSuccessfulRequests = false } = options

	return async (c: Context, next: () => Promise<void>) => {
		const key =
			c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown'
		const now = Date.now()

		// 清理过期条目
		for (const [k, v] of rateLimitStore.entries()) {
			if (now > v.resetTime) {
				rateLimitStore.delete(k)
			}
		}

		const current = rateLimitStore.get(key) || {
			count: 0,
			resetTime: now + windowMs,
		}

		if (now > current.resetTime) {
			current.count = 0
			current.resetTime = now + windowMs
		}

		if (current.count >= maxRequests) {
			c.header('X-RateLimit-Limit', maxRequests.toString())
			c.header('X-RateLimit-Remaining', '0')
			c.header(
				'X-RateLimit-Reset',
				Math.ceil(current.resetTime / 1000).toString()
			)

			return c.json({ error: '请求过多' }, 429)
		}

		current.count++
		rateLimitStore.set(key, current)

		c.header('X-RateLimit-Limit', maxRequests.toString())
		c.header('X-RateLimit-Remaining', (maxRequests - current.count).toString())
		c.header(
			'X-RateLimit-Reset',
			Math.ceil(current.resetTime / 1000).toString()
		)

		await next()

		// 可选择不计算成功请求
		if (skipSuccessfulRequests && c.res.status < 400) {
			current.count--
			rateLimitStore.set(key, current)
		}
	}
}

export function cors() {
	return async (c: Context, next: () => Promise<void>) => {
		const origin = c.req.header('origin')
		const allowedOrigins = config.CORS_ORIGIN.split(',')

		if (
			config.CORS_ORIGIN === '*' ||
			(origin && allowedOrigins.includes(origin))
		) {
			c.header('Access-Control-Allow-Origin', origin || '*')
		}

		c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
		c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
		c.header('Access-Control-Max-Age', '86400')

		if (c.req.method === 'OPTIONS') {
			return c.text('', 204)
		}

		await next()
	}
}
```

## 部署检查清单

### 部署前检查清单

```markdown
## 部署前检查清单

### 代码质量

- [ ] 所有测试通过
- [ ] 代码覆盖率达到要求（>80%）
- [ ] 代码检查无错误
- [ ] 类型检查通过
- [ ] 安全审计通过
- [ ] 依赖项是最新的

### 配置

- [ ] 环境变量已设置
- [ ] 密钥已正确配置
- [ ] 数据库迁移已准备
- [ ] SSL 证书有效
- [ ] 域名 DNS 已配置

### 基础设施

- [ ] 生产环境已配置
- [ ] 负载均衡器已配置
- [ ] 数据库备份已计划
- [ ] 监控已设置
- [ ] 日志记录已配置
- [ ] 警报规则已定义

### 性能

- [ ] 负载测试完成
- [ ] 性能基准达到
- [ ] 缓存已配置
- [ ] CDN 已设置（如需要）
- [ ] 数据库索引已优化

### 安全

- [ ] 安全头已配置
- [ ] 速率限制已启用
- [ ] HTTPS 已强制执行
- [ ] 密钥不在代码中
- [ ] 访问控制已配置
```

### 部署后检查清单

```markdown
## 部署后检查清单

### 验证

- [ ] 应用程序可访问
- [ ] 健康检查通过
- [ ] 所有端点正确响应
- [ ] 数据库连接正常
- [ ] 缓存正常工作
- [ ] SSL 证书有效

### 监控

- [ ] 指标正在收集
- [ ] 日志正在生成
- [ ] 警报已配置
- [ ] 性能监控活跃
- [ ] 错误跟踪正常工作

### 文档

- [ ] 部署说明已更新
- [ ] 运行手册是最新的
- [ ] 团队已通知
- [ ] 回滚计划已准备
```

## 故障排除

### 常见部署问题

1. **容器启动失败**

   ```bash
   # 检查容器日志
   docker logs <container-id>

   # 检查资源使用
   docker stats

   # 验证环境变量
   docker exec <container-id> env
   ```

2. **数据库连接问题**

   ```bash
   # 测试数据库连接
   docker exec <container-id> nc -zv db-host 5432

   # 检查数据库日志
   docker logs <db-container-id>
   ```

3. **高内存使用**

   ```bash
   # 监控内存使用
   docker exec <container-id> cat /proc/meminfo

   # 检查内存泄漏
   curl http://localhost:3000/health
   ```

4. **SSL 证书问题**

   ```bash
   # 检查证书有效性
   openssl x509 -in cert.pem -text -noout

   # 测试SSL连接
   openssl s_client -connect yourdomain.com:443
   ```

## 下一步

- [性能指南](/zh/guides/performance.md) - 优化技术
- [故障排除](/zh/guides/troubleshooting.md) - 常见问题和解决方案
- [最佳实践](/zh/examples/best-practices.md) - 代码组织模式
- [API 参考](/zh/reference/api.md) - 完整的 API 文档
