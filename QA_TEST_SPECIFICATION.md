# QA Test Specification & Frontend Development Guide
## Constructor Demo Server - E-Commerce Platform

**Version:** 1.0.0
**Date:** 2024-11-17
**Purpose:** Complete test cases for QA testing and frontend development

---

## Table of Contents
1. [Authentication Module](#authentication-module)
2. [Product Module](#product-module)
3. [Order Module](#order-module)
4. [Recommendation Module](#recommendation-module)
5. [Real-time/WebSocket Module](#real-time-websocket-module)
6. [Health Check Module](#health-check-module)

---

## Authentication Module

### API Endpoints
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `PUT /api/auth/preferences`

---

### Test Case 1.1: User Registration - Success

**Endpoint:** `POST /api/auth/register`

**Description:** User should be able to register with valid credentials

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Expected Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com"
    }
  }
}
```

**Frontend Requirements:**
- Display success message
- Store JWT token in localStorage/sessionStorage
- Redirect to dashboard/home page
- Display user name in header/profile

**Validation:**
- JWT token should be present in response
- Token should be a valid string
- User object should contain id, name, and email
- Email should match the registration email

---

### Test Case 1.2: User Registration - Email Already Exists

**Endpoint:** `POST /api/auth/register`

**Description:** System should reject registration if email is already registered

**Request:**
```json
{
  "name": "Jane Smith",
  "email": "john@example.com",
  "password": "password456"
}
```

**Expected Response (400 Bad Request):**
```json
{
  "success": false,
  "error": "Email already registered"
}
```

**Frontend Requirements:**
- Display error message: "Email already registered"
- Keep user on registration page
- Highlight email field in red
- Allow user to try different email

---

### Test Case 1.3: User Registration - Validation Errors

**Endpoint:** `POST /api/auth/register`

**Description:** System should validate all required fields

**Test Scenarios:**

**Scenario A - Missing Name:**
```json
{
  "email": "test@example.com",
  "password": "password123"
}
```

**Expected Response (400 Bad Request):**
```json
{
  "success": false,
  "errors": [
    {
      "msg": "Name is required",
      "param": "name",
      "location": "body"
    }
  ]
}
```

**Scenario B - Invalid Email:**
```json
{
  "name": "John Doe",
  "email": "invalid-email",
  "password": "password123"
}
```

**Expected Response (400 Bad Request):**
```json
{
  "success": false,
  "errors": [
    {
      "msg": "Valid email required",
      "param": "email",
      "location": "body"
    }
  ]
}
```

**Scenario C - Password Too Short:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "pass"
}
```

**Expected Response (400 Bad Request):**
```json
{
  "success": false,
  "errors": [
    {
      "msg": "Password must be at least 6 characters",
      "param": "password",
      "location": "body"
    }
  ]
}
```

**Frontend Requirements:**
- Display all validation errors
- Highlight invalid fields in red
- Show inline error messages below each field
- Disable submit button until all fields are valid (client-side validation)

---

### Test Case 1.4: User Login - Success

**Endpoint:** `POST /api/auth/login`

**Description:** User should be able to login with valid credentials

**Request:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com",
      "preferences": {
        "categories": ["Electronics", "Sports"],
        "priceRange": {
          "min": 0,
          "max": 200
        }
      }
    }
  }
}
```

**Frontend Requirements:**
- Store JWT token
- Store user preferences
- Redirect to dashboard
- Display welcome message with user name
- Show user preferences in profile settings

---

### Test Case 1.5: User Login - Invalid Credentials

**Endpoint:** `POST /api/auth/login`

**Description:** System should reject login with wrong email or password

**Test Scenarios:**

**Scenario A - Wrong Email:**
```json
{
  "email": "nonexistent@example.com",
  "password": "password123"
}
```

**Expected Response (401 Unauthorized):**
```json
{
  "success": false,
  "error": "Invalid credentials"
}
```

**Scenario B - Wrong Password:**
```json
{
  "email": "john@example.com",
  "password": "wrongpassword"
}
```

**Expected Response (401 Unauthorized):**
```json
{
  "success": false,
  "error": "Invalid credentials"
}
```

**Frontend Requirements:**
- Display error message: "Invalid email or password"
- Clear password field
- Keep email field populated
- Show "Forgot password?" link
- Do not reveal whether email or password is wrong (security)

---

### Test Case 1.6: Get Current User - Success

**Endpoint:** `GET /api/auth/me`

**Description:** Authenticated user should be able to get their profile

**Request Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "preferences": {
      "categories": ["Electronics", "Sports"],
      "priceRange": {
        "min": 0,
        "max": 200
      }
    },
    "viewHistory": [
      {
        "productId": "507f1f77bcf86cd799439012",
        "viewedAt": "2024-11-10T10:30:00.000Z",
        "duration": 45
      }
    ],
    "purchaseHistory": [
      {
        "orderId": "507f1f77bcf86cd799439013",
        "purchasedAt": "2024-11-09T15:20:00.000Z"
      }
    ],
    "createdAt": "2024-11-01T08:00:00.000Z"
  }
}
```

**Frontend Requirements:**
- Display user profile information
- Show account creation date
- Display viewing history (with product details)
- Display purchase history (with order summaries)
- Allow editing of profile information

---

### Test Case 1.7: Get Current User - Unauthorized

**Endpoint:** `GET /api/auth/me`

**Description:** Request without token should be rejected

**Request Headers:**
```
(No Authorization header)
```

**Expected Response (401 Unauthorized):**
```json
{
  "success": false,
  "error": "No token provided"
}
```

**Frontend Requirements:**
- Redirect to login page
- Clear any stored user data
- Display message: "Please login to continue"

---

### Test Case 1.8: Update User Preferences - Success

**Endpoint:** `PUT /api/auth/preferences`

**Description:** User should be able to update their preferences

**Request Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Request Body:**
```json
{
  "categories": ["Electronics", "Home & Kitchen", "Books"],
  "priceRange": {
    "min": 20,
    "max": 150
  }
}
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "preferences": {
      "categories": ["Electronics", "Home & Kitchen", "Books"],
      "priceRange": {
        "min": 20,
        "max": 150
      }
    }
  }
}
```

**Frontend Requirements:**
- Show preference update form
- Allow multiple category selection (checkboxes)
- Price range slider (min and max)
- Display success message after update
- Update local user state with new preferences

---

## Product Module

### API Endpoints
- `GET /api/products`
- `GET /api/products/:id`
- `POST /api/products`
- `GET /api/products/search/autocomplete`
- `GET /api/products/trending/now`

---

### Test Case 2.1: Get All Products - No Filters

**Endpoint:** `GET /api/products`

**Description:** User should be able to get paginated list of all products

**Request:**
```
GET /api/products
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Wireless Bluetooth Headphones",
      "description": "High-quality wireless headphones with noise cancellation",
      "price": 79.99,
      "category": "Electronics",
      "tags": ["audio", "wireless", "bluetooth", "headphones"],
      "images": ["https://picsum.photos/seed/headphones1/400/400"],
      "inventory": 50,
      "features": {
        "wireless": true,
        "batteryLife": "30 hours",
        "noiseCancellation": true
      },
      "stats": {
        "views": 1250,
        "purchases": 45,
        "rating": 4.5,
        "reviewCount": 38
      },
      "createdAt": "2024-11-01T08:00:00.000Z",
      "updatedAt": "2024-11-15T10:30:00.000Z"
    },
    // ... more products
  ],
  "metadata": {
    "page": 1,
    "limit": 20,
    "total": 15,
    "totalPages": 1
  }
}
```

**Frontend Requirements:**
- Display product grid/list
- Show product image, name, price, rating
- Implement pagination controls
- Display "X of Y products" counter
- Add to cart button on each product
- Quick view button

---

### Test Case 2.2: Get Products - With Category Filter

**Endpoint:** `GET /api/products?category=Electronics`

**Description:** User should be able to filter products by category

**Request:**
```
GET /api/products?category=Electronics
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Wireless Bluetooth Headphones",
      "category": "Electronics",
      "price": 79.99,
      // ... other fields
    },
    {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Smart Fitness Watch",
      "category": "Electronics",
      "price": 149.99,
      // ... other fields
    }
  ],
  "metadata": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "totalPages": 1
  }
}
```

**Frontend Requirements:**
- Category filter dropdown/sidebar
- Highlight selected category
- Show product count per category
- Update URL with category parameter
- Clear filter button

**Available Categories:**
- Electronics
- Clothing
- Home & Kitchen
- Sports
- Books
- Home & Garden
- Accessories

---

### Test Case 2.3: Get Products - With Price Range Filter

**Endpoint:** `GET /api/products?minPrice=50&maxPrice=100`

**Description:** User should be able to filter products by price range

**Request:**
```
GET /api/products?minPrice=50&maxPrice=100
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Wireless Bluetooth Headphones",
      "price": 79.99,
      // ... other fields
    },
    {
      "_id": "507f1f77bcf86cd799439013",
      "name": "Laptop Backpack",
      "price": 59.99,
      // ... other fields
    }
  ],
  "metadata": {
    "page": 1,
    "limit": 20,
    "total": 4,
    "totalPages": 1
  }
}
```

**Frontend Requirements:**
- Price range slider (two handles for min/max)
- Display current min and max values
- Format prices with currency symbol
- Update results in real-time or on Apply button click

---

### Test Case 2.4: Get Products - With Search

**Endpoint:** `GET /api/products?search=wireless`

**Description:** User should be able to search products by text

**Request:**
```
GET /api/products?search=wireless
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Wireless Bluetooth Headphones",
      "tags": ["audio", "wireless", "bluetooth"],
      // ... other fields
    },
    {
      "_id": "507f1f77bcf86cd799439014",
      "name": "Wireless Mouse",
      "tags": ["mouse", "wireless", "computer"],
      // ... other fields
    }
  ],
  "metadata": {
    "page": 1,
    "limit": 20,
    "total": 2,
    "totalPages": 1
  }
}
```

**Frontend Requirements:**
- Search bar with search icon
- Clear search button (X)
- Search on Enter key or button click
- Display "No results for 'query'" if empty
- Highlight search terms in results (optional)

---

### Test Case 2.5: Get Products - With Multiple Filters and Pagination

**Endpoint:** `GET /api/products?category=Electronics&minPrice=50&maxPrice=200&search=wireless&page=1&limit=10&sort=-price`

**Description:** User should be able to combine multiple filters

**Request:**
```
GET /api/products?category=Electronics&minPrice=50&maxPrice=200&search=wireless&page=1&limit=10&sort=-price
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Smart Fitness Watch",
      "price": 149.99,
      "category": "Electronics",
      // ... sorted by price descending
    },
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Wireless Bluetooth Headphones",
      "price": 79.99,
      "category": "Electronics",
      // ... other fields
    }
  ],
  "metadata": {
    "page": 1,
    "limit": 10,
    "total": 2,
    "totalPages": 1
  }
}
```

**Frontend Requirements:**
- Combine all filters (category + price + search)
- Sort dropdown (Price: Low to High, High to Low, Newest, Rating)
- Items per page selector (10, 20, 50)
- Pagination controls (Previous, 1, 2, 3, Next)
- Active filters display with remove option
- "Clear all filters" button

**Sort Options:**
- `-createdAt` (Newest)
- `createdAt` (Oldest)
- `price` (Price: Low to High)
- `-price` (Price: High to Low)
- `-stats.rating` (Highest Rated)
- `-stats.views` (Most Popular)

---

### Test Case 2.6: Get Single Product - Success

**Endpoint:** `GET /api/products/:id`

**Description:** User should be able to view detailed product information

**Request:**
```
GET /api/products/507f1f77bcf86cd799439011
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Wireless Bluetooth Headphones",
    "description": "High-quality wireless headphones with noise cancellation and 30-hour battery life.",
    "price": 79.99,
    "category": "Electronics",
    "tags": ["audio", "wireless", "bluetooth", "headphones"],
    "images": ["https://picsum.photos/seed/headphones1/400/400"],
    "inventory": 50,
    "features": {
      "wireless": true,
      "batteryLife": "30 hours",
      "noiseCancellation": true
    },
    "stats": {
      "views": 1251,
      "purchases": 45,
      "rating": 4.5,
      "reviewCount": 38
    },
    "createdAt": "2024-11-01T08:00:00.000Z",
    "updatedAt": "2024-11-17T10:30:00.000Z"
  }
}
```

**Frontend Requirements:**
- Product image gallery (if multiple images)
- Product name and price (prominent)
- Full description
- Display all features as list
- Stock availability (In Stock / Low Stock / Out of Stock)
- Quantity selector
- Add to Cart button
- Rating stars display (4.5/5)
- Review count (38 reviews)
- Category breadcrumb (Home > Electronics > Headphones)
- Share buttons (optional)

**Note:** View count increases by 1 each time product is viewed

---

### Test Case 2.7: Get Single Product - Not Found

**Endpoint:** `GET /api/products/:id`

**Description:** System should return 404 for non-existent product

**Request:**
```
GET /api/products/invalid-product-id-12345
```

**Expected Response (404 Not Found):**
```json
{
  "success": false,
  "error": "Product not found"
}
```

**Frontend Requirements:**
- Display "Product not found" message
- Show "Browse Products" button
- Redirect to products page
- Log 404 error for analytics

---

### Test Case 2.8: Get Single Product - From Cache

**Endpoint:** `GET /api/products/:id`

**Description:** Product details should be served from cache for performance

**Request:**
```
GET /api/products/507f1f77bcf86cd799439011
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    // ... product data
  },
  "source": "cache"
}
```

**Frontend Requirements:**
- No visual difference for user
- Faster load times
- Cache indicator for debugging (optional, dev mode only)

---

### Test Case 2.9: Create Product - Success (Admin Only)

**Endpoint:** `POST /api/products`

**Description:** Admin should be able to create new product

**Request Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Request Body:**
```json
{
  "name": "Premium Gaming Keyboard",
  "description": "Mechanical keyboard with RGB lighting and programmable keys",
  "price": 129.99,
  "category": "Electronics",
  "tags": ["gaming", "keyboard", "mechanical", "rgb"],
  "images": ["https://example.com/keyboard.jpg"],
  "inventory": 25,
  "features": {
    "switches": "Cherry MX Blue",
    "backlighting": "RGB",
    "programmable": true
  }
}
```

**Expected Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439020",
    "name": "Premium Gaming Keyboard",
    "description": "Mechanical keyboard with RGB lighting and programmable keys",
    "price": 129.99,
    "category": "Electronics",
    "tags": ["gaming", "keyboard", "mechanical", "rgb"],
    "images": ["https://example.com/keyboard.jpg"],
    "inventory": 25,
    "features": {
      "switches": "Cherry MX Blue",
      "backlighting": "RGB",
      "programmable": true
    },
    "stats": {
      "views": 0,
      "purchases": 0,
      "rating": 0,
      "reviewCount": 0
    },
    "createdAt": "2024-11-17T10:35:00.000Z",
    "updatedAt": "2024-11-17T10:35:00.000Z"
  }
}
```

**Frontend Requirements (Admin Panel):**
- Product creation form
- Name input (required)
- Description textarea (required)
- Price input with currency (required)
- Category dropdown (required)
- Tags input (comma-separated or chip input)
- Image upload or URL input
- Inventory number input (required)
- Features key-value pairs (dynamic fields)
- Save and Cancel buttons
- Success notification after creation

---

### Test Case 2.10: Create Product - Validation Errors

**Endpoint:** `POST /api/products`

**Description:** System should validate all required fields

**Request Body:**
```json
{
  "name": "",
  "price": -10,
  "inventory": -5
}
```

**Expected Response (400 Bad Request):**
```json
{
  "success": false,
  "errors": [
    {
      "msg": "Product name is required",
      "param": "name",
      "location": "body"
    },
    {
      "msg": "Description is required",
      "param": "description",
      "location": "body"
    },
    {
      "msg": "Price must be a positive number",
      "param": "price",
      "location": "body"
    },
    {
      "msg": "Category is required",
      "param": "category",
      "location": "body"
    },
    {
      "msg": "Inventory must be a non-negative integer",
      "param": "inventory",
      "location": "body"
    }
  ]
}
```

**Frontend Requirements:**
- Display all validation errors
- Highlight invalid fields
- Prevent form submission until all fields are valid
- Client-side validation before API call

---

### Test Case 2.11: Search Autocomplete - Success

**Endpoint:** `GET /api/products/search/autocomplete?q=wire`

**Description:** User should get search suggestions as they type

**Request:**
```
GET /api/products/search/autocomplete?q=wire
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Wireless Bluetooth Headphones",
      "category": "Electronics",
      "price": 79.99,
      "images": ["https://picsum.photos/seed/headphones1/400/400"]
    },
    {
      "_id": "507f1f77bcf86cd799439014",
      "name": "Wireless Mouse",
      "category": "Electronics",
      "price": 24.99,
      "images": ["https://picsum.photos/seed/mouse1/400/400"]
    }
  ]
}
```

**Frontend Requirements:**
- Dropdown below search input
- Show product image, name, price
- Limit to 10 suggestions
- Debounce input (wait 300ms after user stops typing)
- Highlight matching text
- Click suggestion to navigate to product
- Arrow keys to navigate suggestions
- Enter to select highlighted suggestion
- Minimum 2 characters to trigger search

---

### Test Case 2.12: Search Autocomplete - No Results

**Endpoint:** `GET /api/products/search/autocomplete?q=xyz123`

**Description:** Return empty array for no matches

**Request:**
```
GET /api/products/search/autocomplete?q=xyz123
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "data": []
}
```

**Frontend Requirements:**
- Show "No products found" message
- Suggest popular products or categories
- Hide dropdown if no results

---

### Test Case 2.13: Search Autocomplete - Query Too Short

**Endpoint:** `GET /api/products/search/autocomplete?q=w`

**Description:** Don't search if query is less than 2 characters

**Request:**
```
GET /api/products/search/autocomplete?q=w
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "data": []
}
```

**Frontend Requirements:**
- Don't make API call if less than 2 characters
- Show message "Type at least 2 characters"

---

### Test Case 2.14: Get Trending Products - Success

**Endpoint:** `GET /api/products/trending/now`

**Description:** User should see trending products (most viewed and purchased)

**Request:**
```
GET /api/products/trending/now
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439015",
      "name": "Espresso Machine",
      "price": 199.99,
      "stats": {
        "views": 3200,
        "purchases": 156,
        "rating": 4.8
      },
      // ... other fields
    },
    {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Smart Fitness Watch",
      "price": 149.99,
      "stats": {
        "views": 2100,
        "purchases": 78,
        "rating": 4.7
      },
      // ... other fields
    }
    // ... up to 20 products
  ]
}
```

**Frontend Requirements:**
- Trending section on homepage
- Carousel or grid display
- "Trending" badge on products
- Fire icon or trending indicator
- Limited to 20 products
- Auto-refresh every 30 minutes (cache expires)

---

## Order Module

### API Endpoints
- `POST /api/orders`
- `GET /api/orders/my-orders`
- `GET /api/orders/:id`
- `PATCH /api/orders/:id/status`

---

### Test Case 3.1: Create Order - Success

**Endpoint:** `POST /api/orders`

**Description:** User should be able to create an order

**Request Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Request Body:**
```json
{
  "items": [
    {
      "productId": "507f1f77bcf86cd799439011",
      "quantity": 2
    },
    {
      "productId": "507f1f77bcf86cd799439012",
      "quantity": 1
    }
  ],
  "shippingAddress": {
    "street": "123 Main Street",
    "city": "San Francisco",
    "state": "CA",
    "zipCode": "94102",
    "country": "USA"
  }
}
```

**Expected Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439030",
    "userId": "507f1f77bcf86cd799439010",
    "items": [
      {
        "productId": "507f1f77bcf86cd799439011",
        "quantity": 2,
        "price": 79.99
      },
      {
        "productId": "507f1f77bcf86cd799439012",
        "quantity": 1,
        "price": 149.99
      }
    ],
    "totalAmount": 309.97,
    "status": "pending",
    "shippingAddress": {
      "street": "123 Main Street",
      "city": "San Francisco",
      "state": "CA",
      "zipCode": "94102",
      "country": "USA"
    },
    "createdAt": "2024-11-17T10:40:00.000Z",
    "updatedAt": "2024-11-17T10:40:00.000Z"
  }
}
```

**Frontend Requirements:**
- Shopping cart page
- Review order summary before submission
- Display all items with quantities and prices
- Calculate and show subtotal, tax (if applicable), shipping, and total
- Shipping address form with validation
- Payment method selection (even if not processing payments)
- Place Order button
- Success confirmation page with order ID
- Email confirmation (optional)

**Side Effects:**
- Product inventory decreases by quantity ordered
- Product purchase count increases by 1
- User purchase history updated
- Real-time event emitted (new_order)

---

### Test Case 3.2: Create Order - Validation Errors

**Endpoint:** `POST /api/orders`

**Description:** System should validate order data

**Test Scenarios:**

**Scenario A - Empty Items Array:**
```json
{
  "items": [],
  "shippingAddress": { /* valid address */ }
}
```

**Expected Response (400 Bad Request):**
```json
{
  "success": false,
  "errors": [
    {
      "msg": "Items must be a non-empty array",
      "param": "items",
      "location": "body"
    }
  ]
}
```

**Scenario B - Missing Product ID:**
```json
{
  "items": [
    {
      "quantity": 2
    }
  ],
  "shippingAddress": { /* valid address */ }
}
```

**Expected Response (400 Bad Request):**
```json
{
  "success": false,
  "errors": [
    {
      "msg": "Product ID is required",
      "param": "items[0].productId",
      "location": "body"
    }
  ]
}
```

**Scenario C - Invalid Quantity:**
```json
{
  "items": [
    {
      "productId": "507f1f77bcf86cd799439011",
      "quantity": 0
    }
  ],
  "shippingAddress": { /* valid address */ }
}
```

**Expected Response (400 Bad Request):**
```json
{
  "success": false,
  "errors": [
    {
      "msg": "Quantity must be at least 1",
      "param": "items[0].quantity",
      "location": "body"
    }
  ]
}
```

**Scenario D - Missing Shipping Address Fields:**
```json
{
  "items": [
    {
      "productId": "507f1f77bcf86cd799439011",
      "quantity": 2
    }
  ],
  "shippingAddress": {
    "street": "123 Main St"
    // Missing city, state, zipCode, country
  }
}
```

**Expected Response (400 Bad Request):**
```json
{
  "success": false,
  "errors": [
    {
      "msg": "City is required",
      "param": "shippingAddress.city",
      "location": "body"
    },
    {
      "msg": "State is required",
      "param": "shippingAddress.state",
      "location": "body"
    },
    {
      "msg": "Zip code is required",
      "param": "shippingAddress.zipCode",
      "location": "body"
    },
    {
      "msg": "Country is required",
      "param": "shippingAddress.country",
      "location": "body"
    }
  ]
}
```

**Frontend Requirements:**
- Validate all fields client-side before submission
- Show inline errors for each field
- Disable checkout button until all fields are valid
- Highlight invalid fields in red

---

### Test Case 3.3: Create Order - Product Not Found

**Endpoint:** `POST /api/orders`

**Description:** System should reject order if product doesn't exist

**Request Body:**
```json
{
  "items": [
    {
      "productId": "invalid-product-id-12345",
      "quantity": 1
    }
  ],
  "shippingAddress": { /* valid address */ }
}
```

**Expected Response (400 Bad Request):**
```json
{
  "success": false,
  "error": "Product invalid-product-id-12345 not found"
}
```

**Frontend Requirements:**
- Display error message
- Remove invalid product from cart
- Ask user to review cart and try again

---

### Test Case 3.4: Create Order - Insufficient Inventory

**Endpoint:** `POST /api/orders`

**Description:** System should reject order if not enough inventory

**Request Body:**
```json
{
  "items": [
    {
      "productId": "507f1f77bcf86cd799439011",
      "quantity": 1000
    }
  ],
  "shippingAddress": { /* valid address */ }
}
```

**Expected Response (400 Bad Request):**
```json
{
  "success": false,
  "error": "Insufficient inventory for Wireless Bluetooth Headphones"
}
```

**Frontend Requirements:**
- Display error with product name
- Show available quantity
- Update cart with maximum available quantity
- Allow user to adjust or remove item

---

### Test Case 3.5: Create Order - Unauthorized

**Endpoint:** `POST /api/orders`

**Description:** Guest users cannot create orders

**Request Headers:**
```
(No Authorization header)
```

**Expected Response (401 Unauthorized):**
```json
{
  "success": false,
  "error": "No token provided"
}
```

**Frontend Requirements:**
- Redirect to login page
- Save cart state
- After login, redirect back to checkout
- Display message: "Please login to complete your purchase"

---

### Test Case 3.6: Get User's Orders - Success

**Endpoint:** `GET /api/orders/my-orders?page=1&limit=10`

**Description:** User should see their order history

**Request Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439030",
      "userId": "507f1f77bcf86cd799439010",
      "items": [
        {
          "productId": {
            "_id": "507f1f77bcf86cd799439011",
            "name": "Wireless Bluetooth Headphones",
            "price": 79.99,
            "images": ["https://picsum.photos/seed/headphones1/400/400"]
          },
          "quantity": 2,
          "price": 79.99
        }
      ],
      "totalAmount": 159.98,
      "status": "delivered",
      "shippingAddress": {
        "street": "123 Main Street",
        "city": "San Francisco",
        "state": "CA",
        "zipCode": "94102",
        "country": "USA"
      },
      "createdAt": "2024-11-10T10:40:00.000Z",
      "updatedAt": "2024-11-15T14:20:00.000Z"
    },
    {
      "_id": "507f1f77bcf86cd799439031",
      "totalAmount": 89.99,
      "status": "shipped",
      "createdAt": "2024-11-12T15:30:00.000Z",
      // ... other order details
    }
  ],
  "metadata": {
    "page": 1,
    "limit": 10,
    "total": 5,
    "totalPages": 1
  }
}
```

**Frontend Requirements:**
- Order history page
- Display orders in reverse chronological order (newest first)
- Show order ID, date, status, total amount
- Status badge with color coding:
  - pending: yellow/orange
  - processing: blue
  - shipped: purple
  - delivered: green
  - cancelled: red
- Click order to view details
- Pagination if more than 10 orders
- Filter by status (optional)
- Search by order ID (optional)

---

### Test Case 3.7: Get Order by ID - Success

**Endpoint:** `GET /api/orders/:id`

**Description:** User should see detailed order information

**Request Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Request:**
```
GET /api/orders/507f1f77bcf86cd799439030
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439030",
    "userId": "507f1f77bcf86cd799439010",
    "items": [
      {
        "productId": {
          "_id": "507f1f77bcf86cd799439011",
          "name": "Wireless Bluetooth Headphones",
          "description": "High-quality wireless headphones...",
          "price": 79.99,
          "category": "Electronics",
          "images": ["https://picsum.photos/seed/headphones1/400/400"]
        },
        "quantity": 2,
        "price": 79.99
      }
    ],
    "totalAmount": 159.98,
    "status": "shipped",
    "shippingAddress": {
      "street": "123 Main Street",
      "city": "San Francisco",
      "state": "CA",
      "zipCode": "94102",
      "country": "USA"
    },
    "createdAt": "2024-11-10T10:40:00.000Z",
    "updatedAt": "2024-11-15T14:20:00.000Z"
  }
}
```

**Frontend Requirements:**
- Order details page
- Order ID and date prominently displayed
- Status with visual indicator
- List all items with:
  - Product image
  - Product name (clickable to product page)
  - Quantity
  - Price per unit
  - Subtotal (quantity × price)
- Order summary:
  - Subtotal
  - Shipping
  - Tax (if applicable)
  - Total
- Shipping address display
- Track order button (if shipped)
- Cancel order button (if pending)
- Print/Download invoice button

---

### Test Case 3.8: Get Order by ID - Not Found or Not User's Order

**Endpoint:** `GET /api/orders/:id`

**Description:** User cannot view other users' orders

**Request:**
```
GET /api/orders/507f1f77bcf86cd799439999
```

**Expected Response (404 Not Found):**
```json
{
  "success": false,
  "error": "Order not found"
}
```

**Frontend Requirements:**
- Display "Order not found" message
- Redirect to order history page
- Log error for debugging

---

### Test Case 3.9: Update Order Status - Success

**Endpoint:** `PATCH /api/orders/:id/status`

**Description:** Admin/User should be able to update order status

**Request Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Request Body:**
```json
{
  "status": "shipped"
}
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439030",
    "status": "shipped",
    "updatedAt": "2024-11-17T11:00:00.000Z",
    // ... other order fields
  }
}
```

**Frontend Requirements (Admin Panel):**
- Order management dashboard
- Status dropdown for each order
- Confirm before changing status
- Show status change history/timeline
- Send notification to user on status change

**Valid Status Transitions:**
- `pending` → `processing`
- `processing` → `shipped`
- `shipped` → `delivered`
- Any status → `cancelled` (admin only)

**Side Effect:**
- Real-time event emitted to user (order_status_updated)
- User receives notification

---

### Test Case 3.10: Update Order Status - Invalid Status

**Endpoint:** `PATCH /api/orders/:id/status`

**Description:** System should reject invalid status values

**Request Body:**
```json
{
  "status": "invalid-status"
}
```

**Expected Response (400 Bad Request):**
```json
{
  "success": false,
  "error": "Invalid status"
}
```

**Valid Statuses:**
- `pending`
- `processing`
- `shipped`
- `delivered`
- `cancelled`

---

## Recommendation Module

### API Endpoints
- `GET /api/recommendations`

---

### Test Case 4.1: Get Recommendations - Default (Hybrid)

**Endpoint:** `GET /api/recommendations`

**Description:** User should get personalized product recommendations

**Request Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "productId": "507f1f77bcf86cd799439015",
      "score": 0.87,
      "reason": "Based on your viewing history",
      "product": {
        "_id": "507f1f77bcf86cd799439015",
        "name": "Espresso Machine",
        "price": 199.99,
        "category": "Home & Kitchen",
        "images": ["https://picsum.photos/seed/espresso1/400/400"],
        "stats": {
          "rating": 4.8,
          "reviewCount": 142
        }
      }
    },
    {
      "productId": "507f1f77bcf86cd799439016",
      "score": 0.75,
      "reason": "Users like you also viewed this",
      "product": {
        "_id": "507f1f77bcf86cd799439016",
        "name": "Yoga Mat Premium",
        "price": 39.99,
        "category": "Sports",
        // ... other fields
      }
    },
    {
      "productId": "507f1f77bcf86cd799439017",
      "score": 0.68,
      "reason": "Trending now",
      "product": {
        // ... product details
      }
    }
    // ... up to 10 recommendations
  ],
  "metadata": {
    "source": "computed",
    "strategy": "hybrid",
    "personalized": true
  }
}
```

**Frontend Requirements:**
- "Recommended for You" section
- Display as carousel or grid
- Show recommendation reason as tooltip or subtitle
- Add to cart button on each product
- Quick view option
- "Why this recommendation?" info icon

**How Recommendations Work:**
- **Hybrid Strategy (Default):**
  - 40% Collaborative filtering (based on similar users)
  - 40% Content-based filtering (based on your viewing history)
  - 20% Trending products
- Results sorted by score (highest first)
- Cached for 1 hour per user

---

### Test Case 4.2: Get Recommendations - With Category Filter

**Endpoint:** `GET /api/recommendations?category=Electronics&limit=5`

**Description:** Get recommendations filtered by category

**Request Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "productId": "507f1f77bcf86cd799439011",
      "score": 0.92,
      "reason": "Based on your viewing history",
      "product": {
        "name": "Wireless Bluetooth Headphones",
        "category": "Electronics",
        "price": 79.99
        // ... other fields
      }
    },
    {
      "productId": "507f1f77bcf86cd799439014",
      "score": 0.85,
      "reason": "Users like you also viewed this",
      "product": {
        "name": "Wireless Mouse",
        "category": "Electronics",
        "price": 24.99
        // ... other fields
      }
    }
    // ... up to 5 recommendations
  ],
  "metadata": {
    "source": "computed",
    "strategy": "hybrid",
    "personalized": true
  }
}
```

**Frontend Requirements:**
- Category-specific recommendation sections
- "More in Electronics" heading
- Different sections for different categories

---

### Test Case 4.3: Get Recommendations - Collaborative Filtering

**Endpoint:** `GET /api/recommendations?strategy=collaborative&limit=10`

**Description:** Get recommendations based on similar users

**Expected Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "productId": "507f1f77bcf86cd799439018",
      "score": 0.88,
      "reason": "Users like you also viewed this",
      "product": { /* product details */ }
    }
    // ... recommendations from similar users
  ],
  "metadata": {
    "source": "computed",
    "strategy": "collaborative",
    "personalized": true
  }
}
```

**How Collaborative Filtering Works:**
- Finds users with similar purchase history
- Gets products viewed by similar users
- Filters out products you've already seen
- Scores based on product stats (views, rating, purchases)

---

### Test Case 4.4: Get Recommendations - Content-Based Filtering

**Endpoint:** `GET /api/recommendations?strategy=content-based&limit=10`

**Description:** Get recommendations based on your preferences and history

**Expected Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "productId": "507f1f77bcf86cd799439019",
      "score": 0.91,
      "reason": "Based on your viewing history",
      "product": { /* product details */ }
    }
    // ... recommendations based on your preferences
  ],
  "metadata": {
    "source": "computed",
    "strategy": "content-based",
    "personalized": true
  }
}
```

**How Content-Based Filtering Works:**
- Analyzes your viewed products
- Identifies preferred categories and tags
- Calculates your average price range
- Finds similar products you haven't seen
- Matches category, tags, and price range

---

### Test Case 4.5: Get Recommendations - Unauthorized (Guest User)

**Endpoint:** `GET /api/recommendations`

**Description:** Guest users cannot get personalized recommendations

**Request Headers:**
```
(No Authorization header)
```

**Expected Response (401 Unauthorized):**
```json
{
  "success": false,
  "error": "Unauthorized"
}
```

**Frontend Requirements:**
- Show trending products instead
- Display "Login for personalized recommendations"
- Login button or link

---

### Test Case 4.6: Get Recommendations - From Cache

**Endpoint:** `GET /api/recommendations`

**Description:** Recommendations cached for 1 hour for performance

**Expected Response (200 OK):**
```json
{
  "success": true,
  "data": [ /* recommendations */ ],
  "metadata": {
    "source": "cache",
    "strategy": "hybrid",
    "personalized": true
  }
}
```

**Frontend Requirements:**
- No visual difference
- Faster load times
- Cache indicator in dev mode only

---

## Real-time / WebSocket Module

### WebSocket Events

The application uses Socket.IO for real-time features.

---

### Test Case 5.1: Socket Connection - Success

**Description:** Client should connect to WebSocket server

**Client Code:**
```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:5000', {
  transports: ['websocket']
});

socket.on('connect', () => {
  console.log('Connected:', socket.id);
});

socket.on('disconnect', () => {
  console.log('Disconnected');
});
```

**Server Response:**
```
Console: "New client connected: [socket-id]"
```

**Frontend Requirements:**
- Connect on app load (or after login)
- Show connection status indicator
- Reconnect automatically on disconnect
- Handle connection errors gracefully

---

### Test Case 5.2: Join User Room

**Description:** User joins their personal room for targeted notifications

**Client Code:**
```javascript
socket.emit('join_user_room', userId);
```

**Server Response:**
```
Console: "User [userId] joined their room"
```

**Frontend Requirements:**
- Emit after login/app load
- Use actual user ID from auth state
- Only for authenticated users

---

### Test Case 5.3: Track Event

**Description:** Client can track custom analytics events

**Client Code:**
```javascript
socket.emit('track_event', {
  type: 'page_view',
  page: '/products',
  timestamp: new Date()
});
```

**Server Response:**
```
Console: "Event tracked: { type: 'page_view', ... }"
```

**Frontend Requirements:**
- Track important user actions
- Page views
- Button clicks
- Feature usage
- Don't spam events (throttle if needed)

---

### Test Case 5.4: Product Viewed Event - Received

**Description:** Client receives notification when products are viewed (analytics)

**Server Emits:**
```javascript
{
  userId: "507f1f77bcf86cd799439010",
  productId: "507f1f77bcf86cd799439011",
  timestamp: "2024-11-17T11:30:00.000Z"
}
```

**Client Code:**
```javascript
socket.on('product_viewed', (data) => {
  console.log('Product viewed:', data);
  // Update analytics dashboard
});
```

**Frontend Requirements (Admin Dashboard):**
- Real-time analytics dashboard
- Show product views as they happen
- Update view counter
- Live activity feed

---

### Test Case 5.5: New Order Event - Received

**Description:** Admin receives notification when new orders are placed

**Server Emits:**
```javascript
{
  orderId: "507f1f77bcf86cd799439030",
  userId: "507f1f77bcf86cd799439010",
  totalAmount: 159.98,
  timestamp: "2024-11-17T11:35:00.000Z"
}
```

**Client Code:**
```javascript
socket.on('new_order', (data) => {
  console.log('New order:', data);
  // Show notification
  // Update orders list
  // Play sound (optional)
});
```

**Frontend Requirements (Admin Dashboard):**
- Real-time order notifications
- Popup notification with order details
- Update orders list without refresh
- Sound notification (optional, with user preference)
- Badge counter for new orders

---

### Test Case 5.6: Order Status Updated Event - Received

**Description:** User receives notification when their order status changes

**Server Emits (to specific user room):**
```javascript
{
  orderId: "507f1f77bcf86cd799439030",
  status: "shipped",
  timestamp: "2024-11-17T11:40:00.000Z"
}
```

**Client Code:**
```javascript
socket.on('order_status_updated', (data) => {
  console.log('Order status updated:', data);
  // Show notification to user
  // Update order details if on that page
});
```

**Frontend Requirements:**
- In-app notification popup
- "Your order has been shipped!" message
- Update order status on current page if viewing that order
- Notification badge in header
- Notification history/center

---

### Test Case 5.7: Interaction Tracked Event - Received

**Description:** User receives confirmation that interaction was tracked

**Server Emits (to specific user):**
```javascript
{
  productId: "507f1f77bcf86cd799439011",
  action: "view",
  timestamp: "2024-11-17T11:45:00.000Z"
}
```

**Client Code:**
```javascript
socket.on('interaction_tracked', (data) => {
  console.log('Interaction tracked:', data);
  // Optional: Update UI
});
```

**Frontend Requirements:**
- Silent tracking (no UI change needed)
- Log for debugging in dev mode
- Update recently viewed products

---

### Test Case 5.8: Analytics Event - Received

**Description:** Analytics events for dashboard

**Server Emits:**
```javascript
{
  event: 'recommendations_generated',
  userId: "507f1f77bcf86cd799439010",
  count: 10,
  timestamp: "2024-11-17T11:50:00.000Z"
}
```

**Client Code:**
```javascript
socket.on('analytics', (data) => {
  console.log('Analytics:', data);
  // Update analytics dashboard
});
```

**Frontend Requirements (Admin Dashboard):**
- Real-time analytics charts
- Live event feed
- User activity tracking
- Feature usage statistics

---

## Health Check Module

### Test Case 6.1: Health Check - Success

**Endpoint:** `GET /health`

**Description:** Check if server is running and healthy

**Request:**
```
GET /health
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-11-17T12:00:00.000Z",
    "uptime": 3600.5,
    "memory": {
      "rss": 52428800,
      "heapTotal": 20971520,
      "heapUsed": 15728640,
      "external": 1234567,
      "arrayBuffers": 123456
    }
  }
}
```

**Frontend Requirements:**
- Status page
- Green indicator if status is "healthy"
- Display uptime in human-readable format (e.g., "1 hour")
- Memory usage visualization (optional)
- Auto-refresh every 30 seconds
- Used in monitoring/DevOps dashboards

---

## Error Handling

### Test Case 7.1: 404 Route Not Found

**Description:** Invalid routes return 404

**Request:**
```
GET /api/invalid-route
```

**Expected Response (404 Not Found):**
```json
{
  "success": false,
  "error": "Route not found"
}
```

**Frontend Requirements:**
- 404 page with friendly message
- "Go to Home" button
- Search bar
- Suggested links
- Report broken link option

---

### Test Case 7.2: 500 Server Error

**Description:** Server errors return 500

**Expected Response (500 Internal Server Error):**
```json
{
  "success": false,
  "error": "Internal server error"
}
```

**Frontend Requirements:**
- Generic error page
- "Try again" button
- Error ID for support
- Don't show technical details to users
- Log error to monitoring service

---

### Test Case 7.3: JWT Token Expired

**Description:** Expired tokens are rejected

**Request Headers:**
```
Authorization: Bearer <expired-token>
```

**Expected Response (401 Unauthorized):**
```json
{
  "success": false,
  "error": "Token expired"
}
```

**Frontend Requirements:**
- Clear stored token
- Redirect to login
- Show message: "Session expired. Please login again."
- Save current page to redirect after login

---

### Test Case 7.4: Invalid JWT Token

**Description:** Invalid tokens are rejected

**Request Headers:**
```
Authorization: Bearer invalid-token-string
```

**Expected Response (401 Unauthorized):**
```json
{
  "success": false,
  "error": "Invalid token"
}
```

**Frontend Requirements:**
- Clear stored token
- Redirect to login
- Log potential security issue

---

## Rate Limiting

### Test Case 8.1: Rate Limit Exceeded

**Description:** Too many requests result in rate limiting

**Scenario:** Make 101 requests within 15 minutes from same IP

**Expected Response (429 Too Many Requests):**
```json
{
  "success": false,
  "error": "Too many requests, please try again later"
}
```

**Rate Limit:**
- 100 requests per 15 minutes per IP address

**Frontend Requirements:**
- Display friendly error message
- Show countdown timer until rate limit resets
- Suggest waiting or trying later
- Don't make automated rapid requests

---

## Test Data

### Pre-seeded Users
```javascript
{
  email: "john@example.com",
  password: "password123"
}

{
  email: "jane@example.com",
  password: "password123"
}

{
  email: "bob@example.com",
  password: "password123"
}
```

### Pre-seeded Product Categories
- Electronics (5 products)
- Clothing (1 product)
- Home & Kitchen (4 products)
- Sports (3 products)
- Books (1 product)
- Home & Garden (1 product)

**Total:** 15 products

### Sample Product IDs
*(Will vary after seeding)*
- Check response from `GET /api/products` for actual IDs

---

## Frontend Development Checklist

### Pages Required

1. **Authentication**
   - [ ] Login page
   - [ ] Registration page
   - [ ] Forgot password page (optional)

2. **Product**
   - [ ] Product listing page (with filters, search, sort)
   - [ ] Product detail page
   - [ ] Search results page
   - [ ] Trending products section

3. **Cart & Checkout**
   - [ ] Shopping cart page
   - [ ] Checkout page (shipping info)
   - [ ] Order confirmation page

4. **Orders**
   - [ ] Order history page
   - [ ] Order details page
   - [ ] Order tracking page (optional)

5. **User Account**
   - [ ] Profile page
   - [ ] Preferences/Settings page
   - [ ] Viewing history page

6. **Recommendations**
   - [ ] Recommended products section (homepage)
   - [ ] Category-specific recommendations

7. **Admin** (Optional)
   - [ ] Dashboard with real-time stats
   - [ ] Product management
   - [ ] Order management
   - [ ] Analytics page

8. **Other**
   - [ ] Homepage
   - [ ] 404 page
   - [ ] Error page
   - [ ] About/Contact pages

### Components Required

- [ ] Header with navigation
- [ ] Footer
- [ ] Product card
- [ ] Product filter sidebar
- [ ] Search bar with autocomplete
- [ ] Shopping cart icon with counter
- [ ] User profile dropdown
- [ ] Notification center
- [ ] Pagination
- [ ] Loading spinner
- [ ] Error/Success toast notifications
- [ ] Rating stars display
- [ ] Status badge (for orders)
- [ ] Price display (formatted)
- [ ] Add to cart button
- [ ] Quantity selector
- [ ] Breadcrumbs
- [ ] Modal/Dialog
- [ ] Tabs
- [ ] Form inputs (text, email, password, select, checkbox)

### State Management

- [ ] User authentication state (token, user info)
- [ ] Shopping cart state (items, quantities)
- [ ] Products cache
- [ ] UI state (loading, errors, notifications)
- [ ] WebSocket connection state

### API Integration

- [ ] Axios/Fetch setup with base URL
- [ ] Request interceptor (add auth token)
- [ ] Response interceptor (handle errors)
- [ ] API service modules:
  - [ ] authService.js
  - [ ] productService.js
  - [ ] orderService.js
  - [ ] recommendationService.js

### WebSocket Integration

- [ ] Socket.IO client setup
- [ ] Connect/disconnect handlers
- [ ] Event listeners for all events
- [ ] Reconnection logic

---

## Testing Scenarios

### Happy Path Testing
- [ ] Register → Login → Browse → Add to cart → Checkout → View order
- [ ] Login → View recommendations → Click product → Add to cart
- [ ] Browse products → Filter by category → Sort by price → Add to cart
- [ ] View order history → Click order → View details

### Error Path Testing
- [ ] Register with existing email
- [ ] Login with wrong password
- [ ] Checkout without items
- [ ] Add out-of-stock item to cart
- [ ] Access protected route without login
- [ ] Submit form with invalid data

### Edge Cases
- [ ] Very long product names
- [ ] Very high/low prices
- [ ] 0 inventory items
- [ ] Empty search results
- [ ] Slow network (test loading states)
- [ ] Lost connection (test reconnection)
- [ ] Token expiration during session

---

## Performance Testing

- [ ] Page load time < 2 seconds
- [ ] Search autocomplete < 300ms
- [ ] API responses < 500ms
- [ ] Image lazy loading
- [ ] Pagination for large lists
- [ ] Debounced search input
- [ ] Throttled scroll events

---

## Browser Compatibility

Test on:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile browsers (iOS Safari, Chrome Mobile)

---

## Accessibility

- [ ] Keyboard navigation
- [ ] Screen reader support
- [ ] Alt text for images
- [ ] ARIA labels
- [ ] Focus indicators
- [ ] Color contrast
- [ ] Form labels

---

## Security Testing

- [ ] XSS prevention (escape user input)
- [ ] CSRF protection
- [ ] SQL injection prevention (handled by backend)
- [ ] Secure storage of JWT token
- [ ] HTTPS only (production)
- [ ] Content Security Policy

---

## Notes

1. All prices are in USD ($)
2. JWT tokens expire in 7 days
3. Redis cache expires at different intervals per feature
4. WebSocket events are real-time (no polling needed)
5. Product inventory updates automatically on order
6. Recommendations update every hour (cache)

---

**Document Version:** 1.0
**Last Updated:** 2024-11-17
**Contact:** Developer Team
