# Postman Collection Guide

This guide will help you set up and use the Postman collection to test the Constructor Demo Server API.

## 📥 Import Collection

1. **Open Postman** (Download from [postman.com](https://www.postman.com/downloads/) if you don't have it)

2. **Import the Collection:**
   - Click "Import" button (top left)
   - Drag and drop `Constructor_Demo_API.postman_collection.json`
   - OR click "Upload Files" and select the file

3. **Import the Environment:**
   - Click "Import" again
   - Import `Constructor_Demo_Environment.postman_environment.json`

4. **Select Environment:**
   - In the top-right corner, select "Constructor Demo - Local" from the environment dropdown

## 🚀 Quick Start

### Step 1: Start the Server

Make sure your server is running:

```bash
# With Docker
docker-compose up -d

# Without Docker
npm run build
npm start
```

Verify server is running:
```bash
curl http://localhost:5000/health
```

### Step 2: Seed Database (First Time Only)

```bash
# With Docker
docker-compose exec app npm run seed

# Without Docker
npm run seed
```

This creates test users and products.

### Step 3: Login or Register

**Option A: Login with Pre-seeded User**

1. Open `Authentication` folder in Postman
2. Click `Login - Success`
3. The request body is already filled:
   ```json
   {
     "email": "john@example.com",
     "password": "password123"
   }
   ```
4. Click **Send**
5. ✅ Token automatically saved to environment variables

**Option B: Register New User**

1. Open `Authentication` folder
2. Click `Register User - Success`
3. Click **Send**
4. ✅ Token automatically saved to environment variables

### Step 4: Test Other Endpoints

Now you can test any endpoint! The token is automatically added to requests that need authentication.

Try these in order:
1. ✅ `Products -> Get All Products`
2. ✅ `Products -> Get Single Product` (uses product_id from previous request)
3. ✅ `Orders -> Create Order - Success`
4. ✅ `Orders -> Get My Orders`
5. ✅ `Recommendations -> Get Recommendations`

## 📂 Collection Structure

### 1. Authentication (8 requests)
- ✅ Register User - Success
- ❌ Register User - Email Already Exists
- ❌ Register User - Validation Errors
- ✅ Login - Success
- ❌ Login - Invalid Credentials
- ✅ Get Current User
- ❌ Get Current User - Unauthorized
- ✅ Update User Preferences

### 2. Products (11 requests)
- ✅ Get All Products
- ✅ Get Products - Filter by Category
- ✅ Get Products - Filter by Price Range
- ✅ Get Products - Search by Text
- ✅ Get Products - Combined Filters
- ✅ Get Single Product
- ❌ Get Single Product - Not Found
- ✅ Create Product (requires auth)
- ❌ Create Product - Validation Errors
- ✅ Search Autocomplete
- ✅ Get Trending Products

### 3. Orders (8 requests)
- ✅ Create Order - Success
- ❌ Create Order - Validation Errors
- ❌ Create Order - Insufficient Inventory
- ✅ Get My Orders
- ✅ Get Order by ID
- ❌ Get Order by ID - Not Found
- ✅ Update Order Status
- ❌ Update Order Status - Invalid

### 4. Recommendations (5 requests)
- ✅ Get Recommendations - Hybrid (Default)
- ✅ Get Recommendations - With Category
- ✅ Get Recommendations - Collaborative Filtering
- ✅ Get Recommendations - Content-Based
- ❌ Get Recommendations - Unauthorized

### 5. Health & Monitoring (2 requests)
- ✅ Health Check
- ❌ 404 - Route Not Found

**Legend:**
- ✅ Success case
- ❌ Error/validation case

## 🧪 Automated Tests

Each request includes automated tests that verify:
- ✅ Correct status code
- ✅ Response structure
- ✅ Required fields present
- ✅ Data types correct
- ✅ Business logic (e.g., filtered results match criteria)

### Running Tests

**Run Single Request:**
1. Select a request
2. Click **Send**
3. Check "Test Results" tab (should show all tests passed ✓)

**Run Entire Folder:**
1. Right-click on a folder (e.g., "Products")
2. Click "Run folder"
3. View results in Collection Runner

**Run Entire Collection:**
1. Click the "..." next to collection name
2. Click "Run collection"
3. Click "Run Constructor Demo Server"
4. View test results

## 🔧 Environment Variables

The environment file includes these variables:

| Variable | Description | Auto-set? |
|----------|-------------|-----------|
| `base_url` | API base URL | Manual (default: http://localhost:5000) |
| `auth_token` | JWT authentication token | ✅ Auto (from login/register) |
| `user_id` | Current user ID | ✅ Auto (from register) |
| `product_id` | Sample product ID | ✅ Auto (from get products) |
| `order_id` | Sample order ID | ✅ Auto (from create order) |

**Note:** Variables marked "Auto" are automatically set by test scripts after successful requests.

### Manual Variable Setup

If needed, you can manually edit variables:

1. Click the eye icon (👁️) next to environment dropdown
2. Click "Edit" next to "Constructor Demo - Local"
3. Update values
4. Click "Save"

## 📝 Common Workflows

### Workflow 1: New User Journey

```
1. Register User - Success
   └─> Saves token automatically
2. Get All Products
   └─> Browse available products
3. Get Single Product
   └─> View product details
4. Create Order - Success
   └─> Purchase product
5. Get My Orders
   └─> View order history
6. Get Recommendations
   └─> Discover more products
```

### Workflow 2: Product Search & Filter

```
1. Get All Products
   └─> See all products
2. Get Products - Filter by Category
   └─> Filter by Electronics
3. Get Products - Filter by Price Range
   └─> Filter $50-$100
4. Get Products - Search by Text
   └─> Search "wireless"
5. Get Products - Combined Filters
   └─> Combine all filters
```

### Workflow 3: Order Management

```
1. Login - Success
   └─> Authenticate
2. Create Order - Success
   └─> Place order
3. Get My Orders
   └─> View all orders
4. Get Order by ID
   └─> View specific order
5. Update Order Status
   └─> Change to "processing"
6. Update Order Status (again)
   └─> Change to "shipped"
```

### Workflow 4: Testing Recommendations

```
1. Login - Success
   └─> Must be authenticated
2. Get All Products
   └─> Browse products (builds history)
3. Get Single Product (x3)
   └─> View multiple products
4. Get Recommendations - Hybrid
   └─> See personalized recommendations
5. Get Recommendations - Collaborative
   └─> See similar user recommendations
6. Get Recommendations - Content-Based
   └─> See preference-based recommendations
```

## 🎯 Testing Scenarios

### Happy Path Testing

Test successful operations in order:
1. ✅ Authentication → Login
2. ✅ Products → Get All
3. ✅ Products → Get Single
4. ✅ Orders → Create
5. ✅ Orders → Get My Orders
6. ✅ Recommendations → Get

### Error Testing

Test error handling:
1. ❌ Login with wrong password
2. ❌ Register with existing email
3. ❌ Create order without auth
4. ❌ Create order with invalid data
5. ❌ Get product with invalid ID
6. ❌ Update order with invalid status

### Validation Testing

Test input validation:
1. ❌ Register - empty fields
2. ❌ Register - invalid email
3. ❌ Register - short password
4. ❌ Create Order - empty items
5. ❌ Create Order - missing address
6. ❌ Create Product - negative price

## 🔍 Debugging

### Request Not Working?

**Check Environment:**
- Is "Constructor Demo - Local" selected?
- Is `base_url` correct? (http://localhost:5000)

**Check Server:**
```bash
# Is server running?
curl http://localhost:5000/health

# Check logs
docker-compose logs -f app
# OR
npm start
```

**Check Authentication:**
- Is `auth_token` set? (Check environment variables)
- Try logging in again to refresh token

**Check Test Results:**
- Click on "Test Results" tab after sending request
- Failed tests show what went wrong

### Common Issues

**Issue: "Could not send request"**
- ✅ Solution: Server not running. Start with `docker-compose up -d` or `npm start`

**Issue: "401 Unauthorized"**
- ✅ Solution: Token expired or not set. Run "Login - Success" again

**Issue: "404 Not Found"**
- ✅ Solution: Check `base_url` in environment (should not have trailing slash)

**Issue: "Product not found" when creating order**
- ✅ Solution: Run "Get All Products" first to populate `product_id` variable

**Issue: Tests failing**
- ✅ Solution: Check "Test Results" tab for specific failure
- ✅ Ensure database is seeded: `npm run seed`

## 🔐 Security Notes

- 🔒 The `auth_token` is marked as "secret" in environment
- 🔒 Don't share your environment file with tokens
- 🔒 Tokens expire after 7 days
- 🔒 Use test credentials only: john@example.com / password123

## 📊 Response Examples

### Successful Response
```json
{
  "success": true,
  "data": { /* response data */ },
  "metadata": { /* pagination, source, etc */ }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message here"
}
```

### Validation Error Response
```json
{
  "success": false,
  "errors": [
    {
      "msg": "Email is required",
      "param": "email",
      "location": "body"
    }
  ]
}
```

## 🚀 Advanced Features

### Pre-request Scripts

Some requests use pre-request scripts to generate dynamic data:
- `Register User - Success` uses `{{$timestamp}}` for unique emails

### Test Scripts

All requests include test scripts that:
- Validate response structure
- Check status codes
- Verify business logic
- **Automatically save** variables (token, IDs) for next requests

### Variable Auto-saving

These variables are automatically saved:
- `auth_token` - from login/register
- `user_id` - from register
- `product_id` - from get products (first product)
- `order_id` - from create order

## 💡 Tips & Tricks

1. **Run in Sequence**: Use Collection Runner to run requests in order
2. **Monitor Variables**: Use the eye icon (👁️) to see current variable values
3. **Save Responses**: Click "Save as Example" to save response for documentation
4. **Export Results**: Collection Runner allows exporting test results
5. **Console Debugging**: View > Show Postman Console (logs all requests)

## 📚 Additional Resources

- **API Documentation**: See `QA_TEST_SPECIFICATION.md` for detailed test cases
- **README**: See `README.md` for API endpoint documentation
- **Postman Learning**: [learning.postman.com](https://learning.postman.com/)

## 🆘 Need Help?

If you encounter issues:

1. Check server logs: `docker-compose logs -f app`
2. Verify database is seeded: `docker-compose exec app npm run seed`
3. Check Postman Console: View > Show Postman Console
4. Review test results in "Test Results" tab
5. Ensure all variables are set correctly

## 🎉 You're Ready!

You now have everything you need to test the API:

1. ✅ Collection imported
2. ✅ Environment configured
3. ✅ Server running
4. ✅ Database seeded
5. ✅ Ready to test!

Start with `Authentication -> Login - Success` and explore from there!

---

**Happy Testing! 🚀**
