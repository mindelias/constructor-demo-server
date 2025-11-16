# Constructor Demo Server - E-Commerce Platform

A fully-featured monolithic e-commerce application built with Node.js, Express, TypeScript, MongoDB, and Redis. Features include user authentication, product management, order processing, and an intelligent recommendation engine.

## Features

- 🔐 **User Authentication** - JWT-based auth with bcrypt password hashing
- 🛍️ **Product Management** - CRUD operations with search, filters, and pagination
- 🛒 **Order Processing** - Complete checkout flow with inventory management
- 🤖 **Recommendation Engine** - Hybrid approach combining collaborative and content-based filtering
- ⚡ **Redis Caching** - High-performance caching layer
- 🔌 **Real-time Updates** - Socket.IO for live order updates
- 🛡️ **Security** - Helmet, CORS, rate limiting, input validation
- 📊 **Health Monitoring** - Health check endpoints
- 🐳 **Docker Ready** - Complete containerization setup

## Tech Stack

- **Runtime**: Node.js 20+
- **Framework**: Express 5
- **Language**: TypeScript
- **Database**: MongoDB 7
- **Cache**: Redis 7
- **Real-time**: Socket.IO
- **Authentication**: JWT + bcrypt
- **Validation**: express-validator

## Prerequisites

- Docker and Docker Compose (recommended)
- OR Node.js 20+, MongoDB 7+, Redis 7+

## Quick Start with Docker

1. **Clone and setup**
   ```bash
   git clone <repository-url>
   cd constructor-demo-server
   cp .env.example .env
   ```

2. **Start all services**
   ```bash
   docker-compose up -d
   ```

3. **Seed the database**
   ```bash
   docker-compose exec app npm run seed
   ```

4. **Access the application**
   - API: http://localhost:5000
   - Health Check: http://localhost:5000/health
   - MongoDB Express: http://localhost:8081 (start with `docker-compose --profile tools up`)

## Manual Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your MongoDB and Redis connection strings
   ```

3. **Start MongoDB and Redis**
   ```bash
   # Using Docker
   docker run -d -p 27017:27017 --name mongodb mongo:7
   docker run -d -p 6379:6379 --name redis redis:7-alpine
   ```

4. **Seed the database**
   ```bash
   npm run seed
   ```

5. **Run in development mode**
   ```bash
   npm run dev
   ```

6. **Build for production**
   ```bash
   npm run build
   npm start
   ```

## API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication

All authenticated endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

---

### Auth Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com"
    }
  }
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <token>
```

#### Update User Preferences
```http
PUT /api/auth/preferences
Authorization: Bearer <token>
Content-Type: application/json

{
  "categories": ["Electronics", "Sports"],
  "priceRange": {
    "min": 0,
    "max": 200
  }
}
```

---

### Product Endpoints

#### Get All Products
```http
GET /api/products?category=Electronics&minPrice=0&maxPrice=100&search=wireless&page=1&limit=20
```

**Query Parameters:**
- `category` (optional) - Filter by category
- `minPrice` (optional) - Minimum price
- `maxPrice` (optional) - Maximum price
- `search` (optional) - Text search
- `sort` (optional) - Sort field (default: -createdAt)
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Items per page (default: 20)

**Response:**
```json
{
  "success": true,
  "data": [...],
  "metadata": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

#### Get Single Product
```http
GET /api/products/:id
```

#### Create Product
```http
POST /api/products
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Wireless Headphones",
  "description": "High-quality wireless headphones",
  "price": 79.99,
  "category": "Electronics",
  "tags": ["audio", "wireless"],
  "images": ["https://example.com/image.jpg"],
  "inventory": 50,
  "features": {
    "wireless": true,
    "batteryLife": "30 hours"
  }
}
```

#### Search Products (Autocomplete)
```http
GET /api/products/search/autocomplete?q=wireless
```

#### Get Trending Products
```http
GET /api/products/trending/now
```

---

### Order Endpoints

#### Create Order
```http
POST /api/orders
Authorization: Bearer <token>
Content-Type: application/json

{
  "items": [
    {
      "productId": "507f1f77bcf86cd799439011",
      "quantity": 2
    }
  ],
  "shippingAddress": {
    "street": "123 Main St",
    "city": "San Francisco",
    "state": "CA",
    "zipCode": "94102",
    "country": "USA"
  }
}
```

#### Get My Orders
```http
GET /api/orders/my-orders?page=1&limit=10
Authorization: Bearer <token>
```

#### Get Order by ID
```http
GET /api/orders/:id
Authorization: Bearer <token>
```

#### Update Order Status
```http
PATCH /api/orders/:id/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "shipped"
}
```

**Valid Statuses:** `pending`, `processing`, `shipped`, `delivered`, `cancelled`

---

### Recommendation Endpoints

#### Get Personalized Recommendations
```http
GET /api/recommendations?limit=10&category=Electronics&strategy=hybrid
Authorization: Bearer <token>
```

**Query Parameters:**
- `limit` (optional) - Number of recommendations (default: 10)
- `category` (optional) - Filter by category
- `strategy` (optional) - Strategy: `collaborative`, `content-based`, or `hybrid` (default)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "productId": "507f1f77bcf86cd799439011",
      "score": 0.85,
      "reason": "Based on your viewing history",
      "product": { ... }
    }
  ]
}
```

---

### Health Check

#### Get Health Status
```http
GET /health
```

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-01-15T10:30:00.000Z",
    "uptime": 3600.5,
    "memory": {
      "rss": 52428800,
      "heapTotal": 20971520,
      "heapUsed": 15728640
    }
  }
}
```

---

## WebSocket Events

The application supports real-time updates via Socket.IO:

### Client → Server Events

```javascript
// Join user-specific room
socket.emit('join_user_room', userId);

// Track custom events
socket.emit('track_event', { type: 'page_view', data: {...} });
```

### Server → Client Events

```javascript
// Product viewed
socket.on('product_viewed', (data) => {
  // { userId, productId, timestamp }
});

// New order created
socket.on('new_order', (data) => {
  // { orderId, userId, totalAmount, timestamp }
});

// Order status updated
socket.on('order_status_updated', (data) => {
  // { orderId, status, timestamp }
});
```

---

## Database Seeding

Seed the database with sample data:

```bash
# With Docker
docker-compose exec app npm run seed

# Without Docker
npm run seed
```

This creates:
- 15 sample products across various categories
- 3 test users (password: `password123`)
- Sample orders and user interactions

**Test Credentials:**
- Email: `john@example.com`, Password: `password123`
- Email: `jane@example.com`, Password: `password123`
- Email: `bob@example.com`, Password: `password123`

---

## Architecture

### Recommendation Engine

The application features a sophisticated recommendation engine with three strategies:

1. **Collaborative Filtering** - Based on similar users' behavior
2. **Content-Based Filtering** - Based on product features and user preferences
3. **Hybrid Approach** - Combines both methods for optimal results

### Caching Strategy

- Product details cached for 1 hour
- Trending products cached for 30 minutes
- User affinity scores cached for 7 days

### Security Features

- Helmet.js for secure HTTP headers
- CORS configuration
- Rate limiting (100 requests per 15 minutes)
- Input validation on all endpoints
- JWT token expiration (7 days)
- Password hashing with bcrypt (10 rounds)

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `5000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://mongodb:27017/constructor_demo` |
| `REDIS_HOST` | Redis host | `redis` |
| `REDIS_PORT` | Redis port | `6379` |
| `JWT_SECRET` | JWT signing secret | *required* |
| `JWT_EXPIRES_IN` | JWT expiration | `7d` |
| `CLIENT_URL` | Frontend URL for CORS | `http://localhost:3000` |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window | `900000` |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | `100` |

---

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm run seed` - Seed database with sample data
- `npm run type-check` - Run TypeScript type checking
- `npm test` - Run tests (if configured)

---

## Docker Commands

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop all services
docker-compose down

# Rebuild and restart
docker-compose up -d --build

# Start with MongoDB Express
docker-compose --profile tools up -d

# Execute commands in container
docker-compose exec app npm run seed
```

---

## Project Structure

```
constructor-demo-server/
├── src/
│   ├── config/          # Database and Redis configuration
│   ├── controllers/     # Request handlers
│   ├── middleware/      # Auth, error handling, rate limiting
│   ├── models/          # Mongoose schemas
│   ├── routes/          # API routes
│   ├── services/        # Business logic (recommendation engine)
│   ├── types/           # TypeScript type definitions
│   ├── app.ts           # Express app setup
│   └── server.ts        # Server entry point
├── scripts/
│   └── seedDatabase.ts  # Database seeding script
├── Dockerfile           # Container definition
├── docker-compose.yml   # Multi-container setup
├── .env.example         # Environment variables template
└── package.json         # Dependencies and scripts
```

---

## Migration to Microservices

This monolithic application is designed to be easily split into microservices:

**Potential Services:**
1. **Auth Service** - User authentication and management
2. **Product Service** - Product catalog and search
3. **Order Service** - Order processing and management
4. **Recommendation Service** - ML-powered recommendations
5. **Notification Service** - Real-time notifications
6. **Analytics Service** - User behavior tracking

Each service can be extracted with minimal changes, maintaining clear boundaries between domains.

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

ISC

---

## Support

For issues and questions, please open an issue on GitHub.
