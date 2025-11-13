# API Gateway

Welcome to the API Gateway! This is the **front door** of your microservices architecture.

## 🎯 What is an API Gateway?

**ANALOGY**: Think of a restaurant chain:
- Without a gateway: Customers need to know which kitchen makes pizza, which does desserts, which handles deliveries
- With a gateway: Customers talk to one host who directs everything behind the scenes

**The Gateway**:
- Single entry point for all clients (web, mobile, etc.)
- Routes requests to the right microservice
- Handles authentication, rate limiting, and logging
- Monitors service health

## 🏗️ Architecture

```
Client (Browser/Mobile)
        ↓
  API Gateway (Port 8080)
        ↓
   ┌────┴────┬────────┬───────────┐
   ↓         ↓        ↓           ↓
Auth    Products   Orders   Recommendations
Service  Service   Service      Service
(3000)   (3000)    (3000)       (3000)
```

**Current Setup**: All services point to the same monolith (port 3000)
**Future**: Each service will have its own port when split into microservices

## 📁 Structure

```
gateway/
├── src/
│   ├── config/
│   │   └── services.ts          # Service registry & route mappings
│   ├── middleware/
│   │   ├── auth.ts              # JWT authentication
│   │   ├── proxy.ts             # Request forwarding
│   │   ├── rateLimiter.ts       # Rate limiting
│   │   └── requestLogger.ts     # Request/response logging
│   ├── services/
│   │   └── serviceRegistry.ts   # Service discovery & health checks
│   ├── types/
│   │   └── index.ts             # TypeScript interfaces
│   ├── utils/
│   │   └── healthCheck.ts       # Health check endpoints
│   ├── app.ts                   # Express app setup
│   └── server.ts                # Server entry point
├── package.json
├── tsconfig.json
└── .env.example
```

## 🚀 Getting Started

### 1. Install Dependencies

```bash
cd gateway
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
GATEWAY_PORT=8080
JWT_SECRET=your-super-secret-jwt-key
AUTH_SERVICE_URL=http://localhost:3000
```

### 3. Start the Gateway

```bash
# Development mode (auto-reload)
npm run dev

# Production mode
npm run build
npm start
```

### 4. Test the Gateway

Open your browser to `http://localhost:8080`

## 📡 API Routes

The gateway forwards requests to services based on URL prefix:

| Route Prefix | Service | Auth Required |
|--------------|---------|---------------|
| `/api/auth/*` | Auth Service | No |
| `/api/products/*` | Product Service | No |
| `/api/orders/*` | Order Service | **Yes** |
| `/api/recommendations/*` | Recommendation Service | No |

### Example Requests

```bash
# Login (no auth required)
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password"}'

# Get products (no auth required)
curl http://localhost:8080/api/products

# Create order (auth required)
curl -X POST http://localhost:8080/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"items": [{"productId": "123", "quantity": 2}]}'
```

## 🏥 Health Monitoring

The gateway provides several health check endpoints:

### `/health` - Basic Health
```bash
curl http://localhost:8080/health
```
Returns: Is the gateway running?

### `/ready` - Readiness Check
```bash
curl http://localhost:8080/ready
```
Returns: Is the gateway ready to serve traffic? (checks all services)

### `/live` - Liveness Check
```bash
curl http://localhost:8080/live
```
Returns: Is the gateway process alive and healthy?

### `/status` - Detailed Status
```bash
curl http://localhost:8080/status
```
Returns: Detailed health status of all services with response times

### `/services` - Service Discovery
```bash
curl http://localhost:8080/services
```
Returns: List of all registered services and their endpoints

## 🔐 Authentication

The gateway handles authentication at the edge:

1. **Client sends request** with `Authorization: Bearer <token>` header
2. **Gateway validates JWT** before forwarding to services
3. **Gateway adds headers** to forwarded request:
   - `X-User-ID`: User's ID
   - `X-User-Email`: User's email
4. **Services trust the gateway** and don't need to validate JWT again

### Authentication Modes

- **Required**: Route fails if no valid token (e.g., `/api/orders`)
- **Optional**: Route works without token but adds user info if present (e.g., `/api/products`)

## 🛡️ Rate Limiting

Protects services from abuse:

- **Default**: 100 requests per 15 minutes per client
- **Client identified by**: User ID (if logged in) or IP address
- **Headers returned**:
  - `X-RateLimit-Limit`: Maximum requests allowed
  - `X-RateLimit-Remaining`: Requests remaining
  - `X-RateLimit-Reset`: When the limit resets

When limit exceeded: Returns `429 Too Many Requests`

## 📊 Request Logging

Every request is logged with:
- HTTP method and path
- Response status and time
- User ID (if authenticated)
- Response size

Example output:
```
➡️  GET /api/products (anonymous)
⬅️  200 GET /api/products 45ms 12.5kb
```

## 🔧 Configuration

### Adding a New Service

1. **Add to `config/services.ts`**:
```typescript
{
  name: 'payment-service',
  url: 'http://localhost:3004',
  healthCheck: '/health',
  timeout: 5000,
  retries: 3
}
```

2. **Add route mapping**:
```typescript
{
  prefix: '/api/payments',
  serviceName: 'payment-service',
  stripPrefix: false,
  authRequired: true
}
```

3. **Restart gateway** - it will automatically discover the new service!

### Customizing Rate Limits

In `config/services.ts`:
```typescript
export const GATEWAY_CONFIG = {
  rateLimit: {
    windowMs: 15 * 60 * 1000,  // 15 minutes
    max: 100                    // Max requests
  }
}
```

## 🐛 Troubleshooting

### Service Unavailable (503)
**Problem**: Gateway can't reach a service
**Solution**: Check if the service is running and the URL is correct

```bash
# Check service health
curl http://localhost:8080/status
```

### Gateway Timeout (504)
**Problem**: Service took too long to respond
**Solution**: Check service logs, may need to increase timeout

### Unauthorized (401)
**Problem**: Invalid or missing JWT token
**Solution**: Check token is valid and not expired

## 📈 Production Deployment

### Environment Variables
```env
NODE_ENV=production
GATEWAY_PORT=8080
JWT_SECRET=use-a-strong-secret-here
CORS_ORIGIN=https://your-frontend.com
```

### Recommended Setup
- **Multiple gateway instances** behind a load balancer
- **Redis-based rate limiting** (instead of in-memory)
- **Centralized logging** (ELK stack, CloudWatch, etc.)
- **Service mesh** (Istio, Linkerd) for advanced routing

### Docker Deployment

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY dist ./dist
CMD ["node", "dist/server.js"]
```

## 🎓 Learning Resources

### Key Concepts
- **Service Discovery**: How the gateway finds services
- **Circuit Breaker**: Stops calling unhealthy services (future enhancement)
- **API Composition**: Combining multiple service responses (future enhancement)

### Next Steps
1. Split the monolith into separate microservices
2. Add circuit breaker pattern
3. Implement request/response caching
4. Add API versioning support

## 📝 API Gateway Features

- ✅ Request routing
- ✅ Authentication & authorization
- ✅ Rate limiting
- ✅ Request/response logging
- ✅ Health checks
- ✅ Service discovery
- ✅ Retry logic with exponential backoff
- ⏳ Circuit breaker (coming soon)
- ⏳ Request caching (coming soon)
- ⏳ API versioning (coming soon)

---

**Questions?** Check the `/status` endpoint for real-time service health!
