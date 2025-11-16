# 🔧 Complete Troubleshooting Guide: From Broken to Working

## 📋 Table of Contents
1. [Initial Problem](#initial-problem)
2. [Issue #1: Port Conflict](#issue-1-port-conflict)
3. [Issue #2: Missing Compiled Files](#issue-2-missing-compiled-files)
4. [Issue #3: Wrong File Path](#issue-3-wrong-file-path)
5. [Issue #4: Path Aliases Not Resolving](#issue-4-path-aliases-not-resolving)
6. [Issue #5: Redis Connection](#issue-5-redis-connection)
7. [Key Lessons Learned](#key-lessons-learned)
8. [Prevention Checklist](#prevention-checklist)

---

## Initial Problem

**What you saw:**
```
Error: connect ECONNREFUSED 127.0.0.1:5001
Could not send request
```

**Why it happened:**
The Docker containers weren't running at all - we needed to build and start them.

---

## Issue #1: Port Conflict

### ❌ What Went Wrong

```bash
Error response from daemon: ports are not available: 
exposing port TCP 0.0.0.0:5000 -> 127.0.0.1:0: 
listen tcp 0.0.0.0:5000: bind: address already in use
```

**Root Cause:**
Something else on your machine was already using port 5000.

### ✅ How We Fixed It

**Changed docker-compose.yml:**
```yaml
# BEFORE (port 5000 conflicted):
ports:
  - "5000:5000"

# AFTER (use port 5001 externally):
ports:
  - "5001:5000"  # External:Internal
```

**Also updated environment:**
```yaml
environment:
  PORT: 5000  # Internal container port (NOT 5001)
```

### 📚 Lesson Learned

**Port mapping format:** `"HOST_PORT:CONTAINER_PORT"`
- **Left side (5001):** Port on your machine (localhost)
- **Right side (5000):** Port inside the container
- **Environment variable PORT:** Must match the CONTAINER_PORT (right side)

**Analogy:** Like an apartment building:
- Building address: 5001 (external - how you access it)
- Apartment number: 5000 (internal - what the app uses)

**Next time:**
1. If you get "port already in use", change the LEFT number
2. Keep the RIGHT number and PORT variable the same
3. Always use the LEFT number when testing: `http://localhost:5001`

---

## Issue #2: Missing Compiled Files

### ❌ What Went Wrong

```bash
Error: Cannot find module '/app/dist/server.js'
code: 'MODULE_NOT_FOUND'
```

**Root Cause:**
Dockerfile was trying to run TypeScript files directly without compiling them first.

### ✅ How We Fixed It

**Added build step to Dockerfile:**

```dockerfile
# BEFORE - No compilation:
FROM node:20-alpine
COPY . .
CMD ["node", "dist/server.js"]  # ❌ dist doesn't exist!

# AFTER - Multi-stage build with compilation:
# Stage 1: Build
FROM node:20-alpine AS builder
RUN npm ci
COPY src ./src
RUN npm run build  # ← This creates dist/

# Stage 2: Production
FROM node:20-alpine
COPY --from=builder /app/dist ./dist  # ← Copy compiled code
CMD ["node", "dist/src/server.js"]  # ✅ Now it exists!
```

### 📚 Lesson Learned

**TypeScript projects need compilation:**
1. **TypeScript (.ts files)** → Only you can read
2. **JavaScript (.js files)** → Node.js can run
3. **Build step** → Converts .ts to .js

**Multi-stage Docker build:**
- **Stage 1 (builder):** Install ALL dependencies, compile code
- **Stage 2 (production):** Copy only compiled code, smaller image

**Next time:**
- If you see "Cannot find module" for dist files → Check if build step ran
- Always have `RUN npm run build` in your Dockerfile
- Verify build works locally first: `npm run build && ls dist/`

---

## Issue #3: Wrong File Path

### ❌ What Went Wrong

**Your tsconfig.json compiled to:**
```
dist/
  src/
    server.js  ← File is here
```

**But Dockerfile looked for:**
```
dist/
  server.js  ← Looking here ❌
```

### ✅ How We Fixed It

**Option A - What we did (quickest):**
```dockerfile
# Updated Dockerfile CMD to match actual location:
CMD ["node", "dist/src/server.js"]
```

**Option B - Better long-term:**
Update `tsconfig.json` to output directly to dist/:
```json
{
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"  // ← This makes it output to dist/ not dist/src/
  },
  "include": ["src/**/*"]  // ← Only include src
}
```

### 📚 Lesson Learned

**Understanding TypeScript output structure:**

```
Your tsconfig.json settings determine output structure:

rootDir: "./src" + include: ["src/**/*"]
→ Outputs to: dist/server.js, dist/models/, etc.

No rootDir + include: ["src/**/*", "scripts/**/*"]  
→ Outputs to: dist/src/server.js, dist/scripts/, etc.
```

**Next time:**
1. Run `npm run build` locally
2. Check where files end up: `ls -la dist/`
3. Update Dockerfile CMD to match the actual path
4. Or adjust tsconfig.json to change output structure

---

## Issue #4: Path Aliases Not Resolving

### ❌ What Went Wrong

```bash
Error: Cannot find module '@/models/User'
```

**Your code used:**
```typescript
import User from '@/models/User';  // TypeScript path alias
```

**TypeScript compiled to:**
```javascript
const User = require('@/models/User');  // Still has @ alias!
```

**Node.js said:**
```
❌ I don't know what '@/models/User' means!
```

### ✅ How We Fixed It

**Used module-alias package:**

1. **Installed module-alias:**
```bash
npm install --save module-alias
```

2. **Added to package.json:**
```json
{
  "name": "constructor-demo-server",
  "_moduleAliases": {
    "@": "dist/src"  // ← Maps @ to actual folder
  }
}
```

3. **Added to src/server.ts (FIRST LINE):**
```typescript
import 'module-alias/register';  // ← Loads aliases at startup
```

4. **Updated Dockerfile:**
```dockerfile
CMD ["node", "dist/src/server.js"]  // ← No special flags needed
```

### 📚 Lesson Learned

**Path aliases in TypeScript vs Runtime:**

| Phase | What Happens |
|-------|--------------|
| **Development** | `ts-node` handles aliases automatically |
| **TypeScript Compilation** | Compiles code but KEEPS the aliases |
| **Node.js Runtime** | Doesn't understand aliases ❌ |

**Solutions:**

1. **module-alias** (What we used) ✅
   - Simple, reliable, production-ready
   - Resolves at runtime
   - Requires `import 'module-alias/register'` at app entry

2. **tsc-alias** (Didn't work for us)
   - Should resolve during build
   - Sometimes fails silently
   - Configuration can be tricky

3. **tsconfig-paths** (Tried first)
   - Good for development
   - Needs to be in production dependencies
   - Requires `-r tsconfig-paths/register` flag

4. **No aliases** (Nuclear option)
   - Use relative imports: `../models/User`
   - Ugly but always works
   - No extra dependencies

### Why module-alias Won

```
✅ Works in production
✅ Simple configuration
✅ No build-time issues
✅ Just needs one import line
✅ Production dependency (small)
```

**Next time:**
- If using path aliases in TypeScript, plan for runtime resolution
- Add `module-alias` from the start
- Put `import 'module-alias/register'` as FIRST line in entry file
- Configure `_moduleAliases` in package.json

---

## Issue #5: Redis Connection

### ❌ What Went Wrong

```bash
❌ Redis error: Error: connect ECONNREFUSED 127.0.0.1:6379
```

**Root Cause:**
`.env` file had `localhost` instead of Docker service name.

### ✅ How We Fixed It

**Changed .env:**
```env
# BEFORE (localhost = your machine):
REDIS_URL=redis://localhost:6379  ❌

# AFTER (redis = Docker service name):
REDIS_URL=redis://redis:6379  ✅
```

### 📚 Lesson Learned

**Docker Networking:**

When containers talk to each other, they use **service names** not `localhost`.

```
docker-compose.yml defines:
services:
  app:          ← Service name: "app"
  mongodb:      ← Service name: "mongodb"
  redis:        ← Service name: "redis"

From inside app container:
✅ mongodb:27017    (use service name)
✅ redis:6379       (use service name)
❌ localhost:27017  (this is the container itself)
❌ 127.0.0.1:6379   (same as localhost)
```

**Analogy:**
- `localhost` = talking to yourself
- Service name = calling another apartment in the building

**Environment variables for Docker:**
```env
# For LOCAL development (npm run dev):
MONGODB_URI=mongodb://localhost:27017/mydb
REDIS_URL=redis://localhost:6379

# For DOCKER (docker-compose):
MONGODB_URI=mongodb://mongodb:27017/mydb
REDIS_URL=redis://redis:6379
```

**Next time:**
- Always use Docker service names in `.env` for containerized apps
- Keep a `.env.local` for local development
- Use `.env.example` as template showing Docker service names

---

## Key Lessons Learned

### 1. **Build vs Run**

```bash
docker-compose build    # Creates the image (blueprint)
docker-compose up       # Starts containers (runs the app)
```

**When to rebuild:**
- ✅ Changed Dockerfile
- ✅ Changed code
- ✅ Changed package.json
- ❌ Just restarting the app
- ❌ Changed .env only (just restart)

### 2. **Docker vs Local**

| Thing | Local Development | Docker Container |
|-------|------------------|------------------|
| **Database** | `localhost:27017` | `mongodb:27017` |
| **Redis** | `localhost:6379` | `redis:6379` |
| **Dependencies** | `devDependencies` OK | Only `dependencies` |
| **TypeScript** | Run .ts files directly | Must compile to .js |
| **Path aliases** | `ts-node` handles it | Need runtime resolver |

### 3. **TypeScript in Production**

**Development:**
```bash
npm run dev  # ts-node runs .ts files directly
```

**Production:**
```bash
npm run build  # tsc compiles .ts → .js
npm start      # node runs .js files
```

**Docker does production build:**
```dockerfile
RUN npm run build    # Compile
CMD ["node", "..."]  # Run compiled code
```

### 4. **Debugging Docker Issues**

**Always check in this order:**

1. **Are containers running?**
   ```bash
   docker ps
   ```

2. **Check logs:**
   ```bash
   docker-compose logs app
   ```

3. **Look inside container:**
   ```bash
   docker exec -it constructor_app sh
   ls -la
   ls -la dist/
   ```

4. **Test locally first:**
   ```bash
   npm run build
   npm start
   ```

---

## Prevention Checklist

### ✅ Before You Start

- [ ] Plan for TypeScript compilation in Docker
- [ ] Decide on path alias strategy (module-alias recommended)
- [ ] Create `.env.example` with Docker service names
- [ ] Understand port mapping (external:internal)

### ✅ Writing Dockerfile

- [ ] Use multi-stage build for TypeScript
- [ ] Include `RUN npm run build` in builder stage
- [ ] Copy compiled `dist/` to production stage
- [ ] Set CMD to correct path (check with `npm run build` locally)
- [ ] Use production dependencies only in final stage

### ✅ Configuration Files

**tsconfig.json:**
- [ ] Set `outDir` and `rootDir` correctly
- [ ] Test output with `npm run build && ls dist/`

**package.json:**
- [ ] Build script includes compilation
- [ ] If using path aliases, add `_moduleAliases`
- [ ] `module-alias` in dependencies (not dev)

**.env:**
- [ ] Use Docker service names not `localhost`
- [ ] Document in `.env.example`

### ✅ Before Building Docker

- [ ] Test build locally: `npm run build`
- [ ] Verify dist structure: `ls -la dist/`
- [ ] Check paths match Dockerfile CMD
- [ ] Ensure `.env` has Docker service names

### ✅ After Building Docker

- [ ] Check logs: `docker-compose logs app`
- [ ] Verify health: `curl localhost:PORT/api/health`
- [ ] Test database connection in logs
- [ ] Confirm Redis connection in logs

---

## Quick Reference

### Common Commands

```bash
# Build and start
docker-compose up --build -d

# Stop and remove
docker-compose down

# Rebuild from scratch
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# View logs
docker-compose logs -f app

# Check what's inside container
docker exec -it constructor_app sh
docker exec -it constructor_app ls -la /app/dist

# Test locally before Docker
npm run build
ls -la dist/
npm start
```

### Troubleshooting Quick Checks

**App won't start:**
```bash
docker-compose logs app  # Read the error!
```

**Can't find module:**
```bash
# Check if file exists in container
docker exec constructor_app ls -la /app/dist/
```

**Connection refused:**
```bash
# Check if using service names not localhost
cat .env | grep -E "MONGO|REDIS"
```

**Port conflict:**
```bash
# Find what's using the port
lsof -i :5000
# Or change external port in docker-compose.yml
```

---

## Success Indicators

You know it's working when:

✅ Build completes without errors
✅ `docker ps` shows all containers running
✅ Logs show:
   - "Server running on port 5000"
   - "Connected to MongoDB"
   - "Connected to Redis"
✅ Health check responds: `curl localhost:5001/api/health`
✅ No restart loops in `docker ps` (RESTART column)

---

## Final Wisdom

### What We Did Right This Time

1. ✅ Used multi-stage Docker build
2. ✅ Fixed TypeScript compilation path
3. ✅ Used `module-alias` for path resolution
4. ✅ Fixed environment variables for Docker networking
5. ✅ Tested each step to isolate issues

### What to Remember

- **Docker is NOT magic** - it runs your code in a Linux container
- **TypeScript needs compilation** - .ts files can't run directly in production
- **Path aliases need runtime help** - TypeScript doesn't resolve them
- **Service names not localhost** - Docker networking is different
- **Check logs first** - They tell you exactly what's wrong
- **Test locally first** - If it works locally, then containerize

### The Golden Rule

**If something doesn't work in Docker:**
1. Make it work locally first
2. Then figure out why Docker is different
3. Fix that specific Docker issue

Don't try to fix code AND Docker issues at the same time!

---

## Next Steps

Now that your monolith is working:

1. **Test all endpoints** - Make sure everything works
2. **Load test** - Find the bottlenecks
3. **Document pain points** - Why does it need to be split?
4. **Plan microservices migration** - Which service first?

You've learned the hard way how Docker, TypeScript, and production deployments work. This knowledge is VALUABLE - you can now troubleshoot these issues yourself! 💪

---

**Remember:** Every error message is trying to tell you something specific. Read it carefully, and you'll know exactly what to fix!
