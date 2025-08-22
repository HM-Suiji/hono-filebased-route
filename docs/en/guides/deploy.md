# Deployment Guide

This guide covers deployment strategies, configuration, and best practices for deploying applications built with hono-filebased-route to production environments.

## Overview

Deploying a file-based routing application involves several key considerations:

- Build optimization and asset preparation
- Environment configuration management
- Container orchestration (Docker/Kubernetes)
- CI/CD pipeline setup
- Monitoring and logging
- Security hardening
- Performance optimization

## Build Process

### Production Build Script

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

### Optimized TypeScript Configuration

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

### Build Optimization Script

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
  
  console.log('🏗️  Starting production build...')
  
  try {
    // Clean previous build
    console.log('🧹 Cleaning previous build...')
    execSync('npm run clean', { stdio: 'inherit' })
    
    // Generate routes
    console.log('🛣️  Generating routes...')
    execSync('npm run generate-routes', { stdio: 'inherit' })
    
    // Build with production config
    console.log('📦 Building application...')
    execSync('tsc --project tsconfig.production.json', { stdio: 'inherit' })
    
    // Copy assets
    console.log('📋 Copying assets...')
    execSync('npm run copy-assets', { stdio: 'inherit' })
    
    // Analyze build
    const stats = await analyzeBuild()
    const endTime = performance.now()
    
    stats.buildTime = endTime - startTime
    
    console.log('✅ Production build completed!')
    console.log(`📊 Build time: ${(stats.buildTime / 1000).toFixed(2)}s`)
    console.log(`📦 Bundle size: ${(stats.bundleSize / 1024).toFixed(2)} KB`)
    console.log(`🛣️  Routes: ${stats.routeCount}`)
    console.log(`📚 Dependencies: ${stats.dependencies}`)
    
    return stats
    
  } catch (error) {
    console.error('❌ Build failed:', error)
    process.exit(1)
  }
}

async function analyzeBuild(): Promise<Omit<BuildStats, 'buildTime'>> {
  const distPath = path.join(process.cwd(), 'dist')
  
  // Calculate bundle size
  const bundleSize = await calculateDirectorySize(distPath)
  
  // Count routes
  const routesFile = path.join(distPath, 'generated-routes.js')
  const routesContent = await fs.readFile(routesFile, 'utf-8')
  const routeCount = (routesContent.match(/app\.(get|post|put|delete|patch)/g) || []).length
  
  // Count dependencies
  const packageJson = JSON.parse(await fs.readFile('package.json', 'utf-8'))
  const dependencies = Object.keys({
    ...packageJson.dependencies,
    ...packageJson.devDependencies
  }).length
  
  return {
    bundleSize,
    routeCount,
    dependencies
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

// Run build if called directly
if (require.main === module) {
  buildProduction().catch(console.error)
}

export { buildProduction, type BuildStats }
```

## Environment Configuration

### Environment Variables

```bash
# .env.production
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/myapp
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# Redis Cache
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=your_redis_password

# Security
JWT_SECRET=your_super_secret_jwt_key
CORS_ORIGIN=https://yourdomain.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Monitoring
LOG_LEVEL=info
METRICS_ENABLED=true
HEALTH_CHECK_ENABLED=true

# Performance
CACHE_TTL=300
COMPRESSION_ENABLED=true
KEEP_ALIVE_TIMEOUT=65000
```

### Configuration Management

```typescript
// src/config/index.ts
import { z } from 'zod'

const configSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  HOST: z.string().default('localhost'),
  
  // Database
  DATABASE_URL: z.string(),
  DATABASE_POOL_MIN: z.coerce.number().default(2),
  DATABASE_POOL_MAX: z.coerce.number().default(10),
  
  // Cache
  REDIS_URL: z.string().optional(),
  REDIS_PASSWORD: z.string().optional(),
  CACHE_TTL: z.coerce.number().default(300),
  
  // Security
  JWT_SECRET: z.string().min(32),
  CORS_ORIGIN: z.string().default('*'),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(100),
  
  // Monitoring
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  METRICS_ENABLED: z.coerce.boolean().default(false),
  HEALTH_CHECK_ENABLED: z.coerce.boolean().default(true),
  
  // Performance
  COMPRESSION_ENABLED: z.coerce.boolean().default(true),
  KEEP_ALIVE_TIMEOUT: z.coerce.number().default(65000)
})

function loadConfig() {
  try {
    const config = configSchema.parse(process.env)
    
    // Validate production requirements
    if (config.NODE_ENV === 'production') {
      if (config.JWT_SECRET.length < 32) {
        throw new Error('JWT_SECRET must be at least 32 characters in production')
      }
      
      if (config.CORS_ORIGIN === '*') {
        console.warn('⚠️  CORS_ORIGIN is set to "*" in production. Consider restricting it.')
      }
    }
    
    return config
  } catch (error) {
    console.error('❌ Configuration validation failed:')
    if (error instanceof z.ZodError) {
      error.errors.forEach(err => {
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

## Docker Deployment

### Multi-stage Dockerfile

```dockerfile
# Dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig*.json ./

# Install dependencies
RUN npm ci --only=production --ignore-scripts

# Copy source code
COPY src/ ./src/
COPY scripts/ ./scripts/

# Build application
RUN npm run build:production

# Production stage
FROM node:18-alpine AS production

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S hono -u 1001

WORKDIR /app

# Copy built application
COPY --from=builder --chown=hono:nodejs /app/dist ./dist
COPY --from=builder --chown=hono:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=hono:nodejs /app/package.json ./package.json

# Set user
USER hono

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start application
CMD ["npm", "run", "start:production"]
```

### Docker Compose for Development

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build:
      context: .
      target: production
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:password@db:5432/myapp
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
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
      - "5432:5432"
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 3

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
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

### Production Docker Compose

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
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
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

## Nginx Configuration

### Production Nginx Config

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
    
    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=1r/s;
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # Gzip compression
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
        
        # SSL configuration
        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
        ssl_prefer_server_ciphers off;
        ssl_session_cache shared:SSL:10m;
        ssl_session_timeout 10m;
        
        # API routes with rate limiting
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
            
            # Timeouts
            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }
        
        # Login endpoint with stricter rate limiting
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
        
        # Health check
        location /health {
            proxy_pass http://app;
            access_log off;
        }
        
        # Static files (if any)
        location /static/ {
            expires 1y;
            add_header Cache-Control "public, immutable";
            try_files $uri =404;
        }
        
        # Error pages
        error_page 404 /404.html;
        error_page 500 502 503 504 /50x.html;
        
        location = /50x.html {
            root /usr/share/nginx/html;
        }
    }
}
```

## CI/CD Pipeline

### GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

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
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linting
        run: npm run lint
      
      - name: Run type checking
        run: npm run type-check
      
      - name: Run tests
        run: npm test
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test
      
      - name: Run build
        run: npm run build:production
      
      - name: Upload build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: build-artifacts
          path: dist/

  security:
    runs-on: ubuntu-latest
    needs: test
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Run security audit
        run: npm audit --audit-level high
      
      - name: Run Snyk security scan
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
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Log in to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=ref,event=branch
            type=ref,event=pr
            type=sha,prefix={{branch}}-
            type=raw,value=latest,enable={{is_default_branch}}
      
      - name: Build and push Docker image
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
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Deploy to production
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
      
      - name: Health check
        run: |
          sleep 30
          curl -f https://yourdomain.com/health || exit 1
      
      - name: Notify deployment
        if: always()
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          channel: '#deployments'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

## Kubernetes Deployment

### Kubernetes Manifests

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
  NODE_ENV: "production"
  PORT: "3000"
  LOG_LEVEL: "info"
  METRICS_ENABLED: "true"
  HEALTH_CHECK_ENABLED: "true"

---
# k8s/secret.yaml
apiVersion: v1
kind: Secret
metadata:
  name: hono-secrets
  namespace: hono-app
type: Opaque
data:
  DATABASE_URL: <base64-encoded-database-url>
  JWT_SECRET: <base64-encoded-jwt-secret>
  REDIS_PASSWORD: <base64-encoded-redis-password>

---
# k8s/deployment.yaml
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
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
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
    nginx.ingress.kubernetes.io/rate-limit: "100"
    nginx.ingress.kubernetes.io/rate-limit-window: "1m"
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

## Monitoring and Logging

### Health Check Endpoint

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
    // Check database
    const dbStatus = await checkDatabase()
    
    // Check cache
    const cacheStatus = await checkCache()
    
    // Check memory
    const memoryStatus = checkMemory()
    
    const health: HealthStatus = {
      status: (dbStatus === 'up' && cacheStatus === 'up' && memoryStatus !== 'critical') 
        ? 'healthy' 
        : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      checks: {
        database: dbStatus,
        cache: cacheStatus,
        memory: memoryStatus
      }
    }
    
    // Add detailed metrics if enabled
    if (config.METRICS_ENABLED) {
      const memoryUsage = process.memoryUsage()
      const dbStats = dbPool.getStats()
      const cacheStats = cacheManager.getStats()
      
      health.metrics = {
        memoryUsage: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        cpuUsage: process.cpuUsage().user / 1000000, // Convert to seconds
        activeConnections: dbStats.total - dbStats.available,
        cacheHitRate: cacheStats.hitRate
      }
    }
    
    const responseTime = performance.now() - startTime
    c.header('X-Response-Time', `${responseTime.toFixed(2)}ms`)
    
    const statusCode = health.status === 'healthy' ? 200 : 503
    return c.json(health, statusCode)
    
  } catch (error) {
    console.error('Health check failed:', error)
    
    return c.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed'
    }, 503)
  }
}

async function checkDatabase(): Promise<'up' | 'down'> {
  try {
    const connection = await dbPool.acquire()
    // Simple query to test connection
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

### Structured Logging

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
      version: this.version
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
        stack: config.NODE_ENV === 'development' ? error.stack : undefined
      }
    }
    
    return entry
  }
  
  private output(entry: LogEntry) {
    if (config.NODE_ENV === 'production') {
      console.log(JSON.stringify(entry))
    } else {
      // Pretty print for development
      const timestamp = entry.timestamp.split('T')[1].split('.')[0]
      const level = entry.level.toUpperCase().padEnd(5)
      console.log(`${timestamp} ${level} ${entry.message}`)
      
      if (entry.metadata) {
        console.log('  Metadata:', entry.metadata)
      }
      
      if (entry.error && entry.error.stack) {
        console.log('  Stack:', entry.error.stack)
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

## Security Hardening

### Security Middleware

```typescript
// src/middleware/security.ts
import type { Context } from 'hono'
import { config } from '../config'

// Rate limiting store
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

export function securityHeaders() {
  return async (c: Context, next: () => Promise<void>) => {
    // Security headers
    c.header('X-Content-Type-Options', 'nosniff')
    c.header('X-Frame-Options', 'DENY')
    c.header('X-XSS-Protection', '1; mode=block')
    c.header('Referrer-Policy', 'strict-origin-when-cross-origin')
    c.header('Permissions-Policy', 'geolocation=(), microphone=(), camera=()')
    
    if (config.NODE_ENV === 'production') {
      c.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
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
    const key = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown'
    const now = Date.now()
    
    // Clean up expired entries
    for (const [k, v] of rateLimitStore.entries()) {
      if (now > v.resetTime) {
        rateLimitStore.delete(k)
      }
    }
    
    const current = rateLimitStore.get(key) || { count: 0, resetTime: now + windowMs }
    
    if (now > current.resetTime) {
      current.count = 0
      current.resetTime = now + windowMs
    }
    
    if (current.count >= maxRequests) {
      c.header('X-RateLimit-Limit', maxRequests.toString())
      c.header('X-RateLimit-Remaining', '0')
      c.header('X-RateLimit-Reset', Math.ceil(current.resetTime / 1000).toString())
      
      return c.json({ error: 'Too many requests' }, 429)
    }
    
    current.count++
    rateLimitStore.set(key, current)
    
    c.header('X-RateLimit-Limit', maxRequests.toString())
    c.header('X-RateLimit-Remaining', (maxRequests - current.count).toString())
    c.header('X-RateLimit-Reset', Math.ceil(current.resetTime / 1000).toString())
    
    await next()
    
    // Optionally don't count successful requests
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
    
    if (config.CORS_ORIGIN === '*' || (origin && allowedOrigins.includes(origin))) {
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

## Deployment Checklist

### Pre-deployment Checklist

```markdown
## Pre-deployment Checklist

### Code Quality
- [ ] All tests pass
- [ ] Code coverage meets requirements (>80%)
- [ ] Linting passes without errors
- [ ] Type checking passes
- [ ] Security audit passes
- [ ] Dependencies are up to date

### Configuration
- [ ] Environment variables are set
- [ ] Secrets are properly configured
- [ ] Database migrations are ready
- [ ] SSL certificates are valid
- [ ] Domain DNS is configured

### Infrastructure
- [ ] Production environment is provisioned
- [ ] Load balancer is configured
- [ ] Database backups are scheduled
- [ ] Monitoring is set up
- [ ] Logging is configured
- [ ] Alerting rules are defined

### Performance
- [ ] Load testing completed
- [ ] Performance benchmarks met
- [ ] Caching is configured
- [ ] CDN is set up (if needed)
- [ ] Database indexes are optimized

### Security
- [ ] Security headers are configured
- [ ] Rate limiting is enabled
- [ ] HTTPS is enforced
- [ ] Secrets are not in code
- [ ] Access controls are configured
```

### Post-deployment Checklist

```markdown
## Post-deployment Checklist

### Verification
- [ ] Application is accessible
- [ ] Health checks are passing
- [ ] All endpoints respond correctly
- [ ] Database connections work
- [ ] Cache is functioning
- [ ] SSL certificate is valid

### Monitoring
- [ ] Metrics are being collected
- [ ] Logs are being generated
- [ ] Alerts are configured
- [ ] Performance monitoring is active
- [ ] Error tracking is working

### Documentation
- [ ] Deployment notes are updated
- [ ] Runbook is current
- [ ] Team is notified
- [ ] Rollback plan is ready
```

## Troubleshooting

### Common Deployment Issues

1. **Container fails to start**
   ```bash
   # Check container logs
   docker logs <container-id>
   
   # Check resource usage
   docker stats
   
   # Verify environment variables
   docker exec <container-id> env
   ```

2. **Database connection issues**
   ```bash
   # Test database connectivity
   docker exec <container-id> nc -zv db-host 5432
   
   # Check database logs
   docker logs <db-container-id>
   ```

3. **High memory usage**
   ```bash
   # Monitor memory usage
   docker exec <container-id> cat /proc/meminfo
   
   # Check for memory leaks
   curl http://localhost:3000/health
   ```

4. **SSL certificate issues**
   ```bash
   # Check certificate validity
   openssl x509 -in cert.pem -text -noout
   
   # Test SSL connection
   openssl s_client -connect yourdomain.com:443
   ```

## Next Steps

- [Performance Guide](./performance.md) - Optimization techniques
- [Troubleshooting](./troubleshooting.md) - Common issues and solutions
- [Best Practices](../examples/best-practices.md) - Code organization patterns
- [API Reference](../reference/api.md) - Complete API documentation