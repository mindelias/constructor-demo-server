# Frontend Architecture Decision Records (ADR)
## Constructor E-Commerce Platform

**Purpose**: Document key architectural decisions, trade-offs, alternatives considered, and rationale behind technology choices.

**Date**: November 2024
**Status**: Approved
**Author**: Development Team

---

## Table of Contents

1. [Build Tool: Vite vs Webpack/CRA](#1-build-tool-vite-vs-webpackcra)
2. [State Management: TanStack Query + Zustand + Context](#2-state-management-three-layer-approach)
3. [UI Framework: shadcn/ui vs Material-UI/Chakra](#3-ui-framework-shadcnui-vs-alternatives)
4. [Styling: Tailwind CSS vs CSS-in-JS](#4-styling-tailwind-css-vs-css-in-js)
5. [Forms: React Hook Form + Zod](#5-forms-react-hook-form--zod)
6. [Animations: Framer Motion vs CSS/GSAP](#6-animations-framer-motion)
7. [TypeScript: Strict Mode](#7-typescript-strict-mode)
8. [Routing: React Router v6](#8-routing-react-router-v6)
9. [Testing: Vitest vs Jest](#9-testing-vitest-vs-jest)
10. [Package Manager: npm vs pnpm/yarn](#10-package-manager)

---

## 1. Build Tool: Vite vs Webpack/CRA

### **Decision**: Use Vite 5+

### **Context**
We need a modern build tool that provides fast development experience and optimized production builds for our React application.

### **Alternatives Considered**

| Tool | Pros | Cons |
|------|------|------|
| **Vite** | ⚡ Lightning-fast HMR (<50ms)<br>🚀 ESBuild-powered (10-100x faster)<br>📦 Optimized production builds<br>🎯 Zero config for modern apps<br>🌳 Better tree-shaking | 🆕 Newer (less mature than webpack)<br>🔌 Smaller plugin ecosystem<br>⚠️ Some legacy libraries may need config |
| **Webpack 5** | 🏆 Industry standard<br>🔌 Huge plugin ecosystem<br>🛠️ Maximum flexibility<br>📚 Extensive documentation | 🐌 Slower dev server (seconds)<br>⚙️ Complex configuration<br>📦 Larger bundle sizes<br>🔧 Requires manual optimization |
| **Create React App** | 🎁 Zero configuration<br>📦 All-in-one solution<br>👶 Beginner-friendly | 🔒 Limited customization<br>🐌 Slow (uses webpack internally)<br>⚰️ No longer actively maintained<br>🚫 Can't eject safely |
| **Turbopack** | ⚡ Very fast (Rust-based)<br>🆕 Next-gen tool | 🚧 Still in beta<br>🔗 Tied to Next.js<br>⚠️ Not production-ready |

### **Our Choice: Vite**

**Reasons:**

1. **Developer Experience (DX)**
   ```
   Cold Start Times:
   - Vite: ~200ms
   - Webpack: ~3-5 seconds
   - CRA: ~5-10 seconds

   Hot Module Replacement (HMR):
   - Vite: <50ms (instant)
   - Webpack: 1-3 seconds
   - CRA: 2-5 seconds
   ```

2. **Modern by Default**
   - Native ES modules in dev
   - Auto CSS code splitting
   - Built-in TypeScript support
   - Automatic vendor chunking

3. **Production Performance**
   - Rollup-based production builds
   - Better tree-shaking
   - Smaller bundle sizes (~20-30% smaller)
   - Pre-bundling of dependencies (ESBuild)

4. **Zero Configuration**
   ```javascript
   // vite.config.ts - Minimal config
   export default defineConfig({
     plugins: [react()],
     // That's it for basic setup!
   })
   ```

5. **Future-Proof**
   - Aligns with web standards (ES modules)
   - Active development (Evan You / Vue team)
   - Growing ecosystem
   - Next.js moving to similar patterns

### **Trade-offs**

**What We Gain:**
- ⚡ 10-100x faster development
- 🎯 Better developer experience
- 📦 Smaller production bundles
- 🚀 Faster build times

**What We Accept:**
- 🔌 Smaller plugin ecosystem (but growing)
- 📚 Less Stack Overflow answers (newer tool)
- 🛠️ May need extra config for legacy libs

### **When You Might Choose Differently**

- **Choose Webpack if**: You need specific plugins only available for webpack, or working with a very complex micro-frontend architecture
- **Choose Next.js/Turbopack if**: Building a server-rendered app with SEO requirements
- **Choose CRA if**: Building a quick prototype and don't care about performance (not recommended)

### **Real-World Impact**

```yaml
Developer Productivity:
  - Save ~2-4 seconds per code change
  - 100 changes/day = 3-7 minutes saved
  - Better focus (no waiting)

Build Performance:
  - Dev server startup: 200ms vs 5s (25x faster)
  - HMR: 50ms vs 2s (40x faster)
  - Production build: 15s vs 45s (3x faster)
```

**Verdict**: Vite is the modern choice for React apps. The DX improvement alone justifies the decision. The ecosystem is mature enough for production use.

---

## 2. State Management: Three-Layer Approach

### **Decision**: TanStack Query + Zustand + Context

### **The Problem**

State management is complex. We have different types of state:

```typescript
// Server State (from API)
- Products, Orders, User profile
- Needs caching, refetching, synchronization

// Client State (UI only)
- Shopping cart, Theme preference, Filters
- Needs persistence, simple updates

// Auth State (special case)
- User token, Permissions
- Needs to be available everywhere
- Critical for security
```

### **Why Not Just One Solution?**

**Attempt 1: Only Zustand**
```typescript
// ❌ Problems:
const useStore = create((set) => ({
  products: [],
  loading: false,
  error: null,

  fetchProducts: async () => {
    set({ loading: true })
    const data = await api.getProducts()
    set({ products: data, loading: false })
  }
}))

// Issues:
// 1. Manual loading/error handling
// 2. No automatic caching
// 3. No background refetching
// 4. No request deduplication
// 5. Stale data problems
// 6. Memory leaks if not careful
```

**Attempt 2: Only Context**
```typescript
// ❌ Problems:
<AuthContext>
  <CartContext>
    <ProductsContext>
      <OrdersContext>
        <UIContext>
          {/* Provider hell */}
          <App />
        </UIContext>
      </OrdersContext>
    </ProductsContext>
  </CartContext>
</AuthContext>

// Issues:
// 1. Provider hell (hard to read)
// 2. Re-render issues (all children re-render)
// 3. No built-in persistence
// 4. Verbose boilerplate
```

**Attempt 3: Only Redux**
```typescript
// ❌ Problems:
// 1. Massive boilerplate
// 2. Actions, reducers, selectors for everything
// 3. No built-in async handling (need thunks/sagas)
// 4. Steep learning curve
// 5. Overkill for most apps
```

### **Our Solution: Layered Approach**

```typescript
// Layer 1: Server State → TanStack Query
const { data: products } = useQuery({
  queryKey: ['products'],
  queryFn: fetchProducts,
  // Auto handles: caching, loading, error, refetch, dedup
})

// Layer 2: Client State → Zustand
const useCartStore = create(
  persist(
    (set) => ({
      items: [],
      addItem: (item) => set((state) => ({
        items: [...state.items, item]
      }))
    }),
    { name: 'cart-storage' }
  )
)

// Layer 3: Auth State → Context
const AuthContext = createContext()
// Only auth, used everywhere, minimal re-renders
```

### **Decision Breakdown**

#### **2.1 TanStack Query for Server State**

**Alternatives:**

| Solution | Server State Handling |
|----------|----------------------|
| **TanStack Query** | ✅ Built specifically for this<br>✅ Auto caching, refetching<br>✅ Request deduplication<br>✅ Background updates |
| **SWR** | ✅ Similar to TanStack Query<br>⚠️ Smaller ecosystem<br>⚠️ Less features |
| **Redux Toolkit Query** | ✅ Good caching<br>❌ Requires Redux setup<br>❌ More boilerplate |
| **Apollo Client** | ✅ Great for GraphQL<br>❌ Overkill for REST<br>❌ Large bundle size |
| **Manual Zustand** | ❌ No built-in caching<br>❌ Manual everything<br>❌ Reinventing the wheel |

**Why TanStack Query?**

```typescript
// What you write:
const { data, isLoading, error } = useQuery({
  queryKey: ['products'],
  queryFn: fetchProducts
})

// What you get for FREE:
// ✅ Automatic caching
// ✅ Background refetching
// ✅ Request deduplication
// ✅ Optimistic updates
// ✅ Infinite scroll support
// ✅ Prefetching
// ✅ Retry logic
// ✅ Query invalidation
// ✅ Window focus refetching
// ✅ Garbage collection
```

**Real Example:**

```typescript
// Without TanStack Query (Zustand only):
const useProductStore = create((set, get) => ({
  products: [],
  loading: false,
  error: null,
  cache: {},
  lastFetch: null,

  fetchProducts: async () => {
    // Check cache
    const now = Date.now()
    if (get().lastFetch && now - get().lastFetch < 5 * 60 * 1000) {
      return // Use cache
    }

    set({ loading: true, error: null })

    try {
      const data = await api.getProducts()
      set({
        products: data,
        loading: false,
        lastFetch: now,
        cache: { products: data }
      })
    } catch (error) {
      set({ error, loading: false })
    }
  }
}))

// With TanStack Query:
const { data: products } = useQuery({
  queryKey: ['products'],
  queryFn: fetchProducts,
  staleTime: 5 * 60 * 1000
})

// 50+ lines → 5 lines, with MORE features!
```

**Trade-offs:**

**What We Gain:**
- ✅ 90% less code for server state
- ✅ Automatic caching & invalidation
- ✅ Better UX (background updates)
- ✅ No stale data issues
- ✅ Built-in DevTools

**What We Accept:**
- 📦 +15kb bundle size
- 📚 New API to learn
- 🧠 Different mental model

**Verdict**: TanStack Query is the industry standard for server state. It's used by AWS, Google, Microsoft. The DX and features justify the bundle size.

---

#### **2.2 Zustand for Client State**

**Alternatives:**

| Solution | Client State |
|----------|--------------|
| **Zustand** | ✅ Minimal API<br>✅ No providers<br>✅ 1kb bundle<br>✅ Built-in persistence |
| **Redux** | ✅ Powerful DevTools<br>❌ Massive boilerplate<br>❌ Steep learning curve<br>📦 Large bundle |
| **Jotai/Recoil** | ✅ Atomic state<br>⚠️ Different paradigm<br>⚠️ More complex |
| **Context API** | ✅ Built-in<br>❌ Provider hell<br>❌ Re-render issues<br>❌ No persistence |

**Why Zustand?**

```typescript
// Redux (same feature):
// 1. Create action types
const ADD_TO_CART = 'ADD_TO_CART'
const REMOVE_FROM_CART = 'REMOVE_FROM_CART'

// 2. Create action creators
const addToCart = (item) => ({ type: ADD_TO_CART, payload: item })

// 3. Create reducer
const cartReducer = (state = [], action) => {
  switch (action.type) {
    case ADD_TO_CART:
      return [...state, action.payload]
    // ...
  }
}

// 4. Create store
const store = createStore(cartReducer)

// 5. Use in component
const items = useSelector(state => state.cart.items)
const dispatch = useDispatch()
dispatch(addToCart(item))

// Zustand (same feature):
const useCartStore = create((set) => ({
  items: [],
  addItem: (item) => set((state) => ({ items: [...state.items, item] }))
}))

// Use in component
const { items, addItem } = useCartStore()
addItem(item)

// 50+ lines → 5 lines
```

**Zustand Benefits:**

1. **No Provider Wrapper**
   ```typescript
   // Redux/Context:
   <Provider store={store}>
     <App />
   </Provider>

   // Zustand:
   <App /> // Just works!
   ```

2. **Built-in Persistence**
   ```typescript
   const useCartStore = create(
     persist(
       (set) => ({ items: [] }),
       { name: 'cart-storage' } // Auto saves to localStorage
     )
   )
   ```

3. **Minimal Re-renders**
   ```typescript
   // Only re-renders when `items` changes, not entire store
   const items = useCartStore((state) => state.items)
   ```

**Trade-offs:**

**What We Gain:**
- ⚡ Extremely lightweight (1kb)
- 🎯 Simple API (5 minute learning curve)
- 🔋 Built-in persistence
- 🚀 No providers needed

**What We Accept:**
- 🛠️ Less powerful DevTools than Redux
- 📚 Smaller community than Redux

**Verdict**: Perfect for client state. Redux is overkill for most apps. Zustand gives you 90% of the power with 10% of the complexity.

---

#### **2.3 Context for Auth State**

**The Question**: "Why not just use Zustand for auth too?"

**Valid question!** Let's analyze:

**Option 1: Zustand for Auth**
```typescript
// ✅ Pros:
const useAuthStore = create((set) => ({
  user: null,
  token: null,
  login: (token) => set({ token }),
  logout: () => set({ user: null, token: null })
}))

// Simple, works fine

// ❌ Cons:
// 1. Any component can call logout() - security risk
// 2. Token accessible from any component - XSS risk
// 3. No centralized auth logic
// 4. Harder to add middleware (token refresh, etc.)
```

**Option 2: Context for Auth** ✅
```typescript
// AuthContext.tsx
const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => getStoredToken())

  // Centralized logic
  const login = useCallback(async (credentials) => {
    const { token, user } = await authApi.login(credentials)
    setToken(token)
    setUser(user)
    storeToken(token) // Secure storage
    setupAxiosInterceptors(token)
    startTokenRefresh()
  }, [])

  const logout = useCallback(() => {
    setToken(null)
    setUser(null)
    clearStoredToken()
    clearAxiosInterceptors()
    stopTokenRefresh()
    // Navigate to login
  }, [])

  // Auto token refresh
  useEffect(() => {
    if (token) {
      const interval = setInterval(refreshToken, 5 * 60 * 1000)
      return () => clearInterval(interval)
    }
  }, [token])

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
```

**Why Context Wins for Auth:**

1. **Encapsulation**
   - Auth logic in one place
   - Private functions (token refresh, validation)
   - Can't be bypassed

2. **Lifecycle Hooks**
   ```typescript
   // Easy to add effects
   useEffect(() => {
     // Check token on mount
     // Set up interceptors
     // Start refresh interval
   }, [])
   ```

3. **Tree-Level Protection**
   ```typescript
   <AuthProvider>
     <ProtectedRoutes />  {/* Only these have auth */}
   </AuthProvider>
   ```

4. **Security**
   ```typescript
   // Context provider can:
   // - Validate tokens before storing
   // - Encrypt sensitive data
   // - Add audit logging
   // - Centralize security logic
   ```

**Hybrid Approach** (What we actually do):
```typescript
// Context for auth logic + Zustand for UI state
const AuthContext = createContext() // Auth logic
const useUIStore = create() // Theme, sidebar, etc.
const useCartStore = create() // Cart items

// Best of both worlds:
// - Context: Auth, security, lifecycle
// - Zustand: Simple UI state
// - TanStack Query: Server data
```

**Trade-offs:**

**What We Gain:**
- 🔒 Better security (centralized)
- 🎯 Lifecycle control
- 🛡️ Encapsulation
- 🔌 Middleware support

**What We Accept:**
- 🏗️ One provider in tree
- 📝 Slightly more boilerplate

**Verdict**: Context for auth is the right choice. Security and lifecycle management are more important than avoiding one provider.

---

## 3. UI Framework: shadcn/ui vs Alternatives

### **Decision**: shadcn/ui + Radix UI

### **Alternatives:**

| Framework | Approach | Pros | Cons |
|-----------|----------|------|------|
| **shadcn/ui** | Copy-paste components | ✅ Full control<br>✅ No dependencies<br>✅ Customizable<br>✅ Small bundle | ⚠️ Manual updates<br>⚠️ More code in repo |
| **Material-UI** | Import from package | ✅ Complete system<br>✅ Battle-tested<br>✅ Huge ecosystem | ❌ Large bundle (>100kb)<br>❌ Hard to customize<br>❌ Opinionated design |
| **Chakra UI** | Import from package | ✅ Great DX<br>✅ Good defaults<br>✅ Accessible | ❌ Runtime CSS-in-JS<br>❌ Performance overhead<br>📦 Medium bundle |
| **Ant Design** | Import from package | ✅ Enterprise features<br>✅ Complete | ❌ Chinese design language<br>❌ Hard to customize<br>📦 Large bundle |
| **Headless UI** | Unstyled components | ✅ Full control<br>✅ Small bundle | ❌ No default styling<br>❌ Build everything |

### **Why shadcn/ui?**

**Philosophy**: "Copy the code, own the code"

```typescript
// Traditional UI library:
import { Button } from '@mui/material'
// ❌ Stuck with their implementation
// ❌ Can't see the code
// ❌ Bundle includes unused components
// ❌ Hard to customize

// shadcn/ui:
npx shadcn-ui add button
// ✅ Code is in YOUR repo (components/ui/button.tsx)
// ✅ Can modify freely
// ✅ Only bundle what you use
// ✅ Full TypeScript support
```

**Real Example:**

```typescript
// Material-UI Button customization:
const StyledButton = styled(MuiButton)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  '&:hover': {
    backgroundColor: theme.palette.primary.dark,
  },
  // Fighting the framework...
}))

// shadcn/ui Button customization:
// Just edit components/ui/button.tsx directly!
export const Button = ({ className, ...props }) => (
  <button
    className={cn(
      "bg-primary hover:bg-primary/90", // Just change this
      className
    )}
    {...props}
  />
)
```

**Built on Radix UI**:
```typescript
// shadcn/ui uses Radix primitives underneath
// Radix UI = Unstyled, accessible components
// You get:
// ✅ WCAG AA compliance
// ✅ Keyboard navigation
// ✅ Focus management
// ✅ Screen reader support
// ✅ Proven patterns

// Example:
<Dialog>  {/* Radix primitive */}
  <DialogTrigger>Open</DialogTrigger>
  <DialogContent>
    {/* Styled with your design system */}
  </DialogContent>
</Dialog>
```

**Trade-offs:**

**What We Gain:**
- 🎯 Full control over code
- 📦 Smallest possible bundle
- 🎨 Easy customization
- ♿ Accessibility built-in
- 🚀 No dependency updates breaking changes

**What We Accept:**
- 📁 More code in repo
- 🔄 Manual component updates (rare)
- 🛠️ Need to understand the code

**Verdict**: shadcn/ui is perfect for custom designs. You own the code, not a dependency. The bundle size and customization benefits outweigh having more code in the repo.

---

## 4. Styling: Tailwind CSS vs CSS-in-JS

### **Decision**: Tailwind CSS 3.4+

### **The Great Styling Debate**

| Approach | Example | Pros | Cons |
|----------|---------|------|------|
| **Tailwind** | `className="flex gap-4 p-4"` | ✅ Zero runtime<br>✅ Tiny bundle<br>✅ Fast development | ⚠️ HTML can look messy<br>⚠️ Learning curve |
| **CSS-in-JS** | `styled.div\`padding: 1rem\`` | ✅ Dynamic styling<br>✅ Component scoped | ❌ Runtime cost<br>❌ Larger bundle<br>❌ Slower |
| **CSS Modules** | `import styles from './Button.module.css'` | ✅ Scoped styles<br>✅ Familiar CSS | ❌ Context switching<br>❌ No constraints |
| **Vanilla CSS** | `<div class="container">` | ✅ Simple<br>✅ Standard | ❌ Global namespace<br>❌ Hard to maintain |

### **Why Tailwind?**

**1. Performance**
```typescript
// CSS-in-JS (Styled Components):
const Button = styled.button`
  padding: 1rem 2rem;
  background: blue;
`
// At runtime:
// 1. Parse template literal
// 2. Generate CSS
// 3. Inject style tag
// 4. Calculate className
// = ~5-10ms per component render

// Tailwind:
<button className="px-8 py-4 bg-blue-500">
// At runtime:
// = 0ms (CSS already in bundle)

// Performance impact:
// 100 components = 500-1000ms saved
```

**2. Bundle Size**
```yaml
CSS-in-JS App:
  - Styled Components lib: ~15kb
  - Emotion lib: ~12kb
  - Runtime overhead: ~5kb
  - Generated styles: ~20kb
  Total: ~52kb

Tailwind App:
  - Tailwind CSS: 0kb (build-time)
  - Used utilities only: ~8-15kb
  - Runtime overhead: 0kb
  Total: ~8-15kb

Savings: ~37kb (70% smaller!)
```

**3. Development Speed**
```typescript
// Old way (CSS-in-JS):
const Card = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.5rem;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);

  @media (min-width: 768px) {
    flex-direction: row;
    gap: 2rem;
  }
`

// Tailwind way:
<div className="flex flex-col md:flex-row gap-4 md:gap-8 p-6 rounded-lg shadow">
```

**4. Consistency**
```typescript
// Without constraints:
const Button1 = styled.button`padding: 15px;`
const Button2 = styled.button`padding: 16px;`
const Button3 = styled.button`padding: 1rem;`
// All slightly different!

// With Tailwind:
<button className="p-4">  // p-4 = 1rem (design system)
// Everyone uses the same scale
// Consistency enforced!
```

**5. Dark Mode**
```typescript
// CSS-in-JS:
const Button = styled.button`
  background: ${props => props.theme.mode === 'dark' ? '#333' : '#fff'};
  color: ${props => props.theme.mode === 'dark' ? '#fff' : '#333'};
`
// Need theme provider, props drilling, re-renders

// Tailwind:
<button className="bg-white dark:bg-gray-800 text-gray-800 dark:text-white">
// Just works, no re-renders
```

**Common Concerns & Answers:**

**"HTML looks messy"**
```typescript
// Concern:
<div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">

// Solution 1: Extract to component
<Card variant="hoverable">

// Solution 2: Use @apply (sparingly)
.card {
  @apply flex items-center justify-between p-4 bg-white rounded-lg;
}

// Reality: You get used to it in ~1 week
```

**"Hard to learn"**
```typescript
// True: ~1 week learning curve
// But CSS-in-JS also has learning curve
// Plus: Tailwind IntelliSense = instant docs
```

**"Can't do dynamic styles"**
```typescript
// Concern: Dynamic styles

// Wrong way:
className={`bg-${color}-500`}  // ❌ Won't work (purging)

// Right way:
className={color === 'blue' ? 'bg-blue-500' : 'bg-red-500'}  // ✅

// Or use CSS variables:
style={{ '--color': color }}
className="bg-[var(--color)]"
```

**Trade-offs:**

**What We Gain:**
- ⚡ Zero runtime cost
- 📦 Smaller bundles
- 🚀 Faster development
- 🎨 Design system constraints
- 🌓 Easy dark mode

**What We Accept:**
- 📚 Learning curve (~1 week)
- 📝 Longer className strings
- 🎯 Less flexible than CSS-in-JS

**Verdict**: Tailwind is the modern standard. Used by GitHub, Netflix, NASA, Shopify. The performance and DX benefits outweigh the concerns.

---

## 5. Forms: React Hook Form + Zod

### **Decision**: React Hook Form + Zod validation

### **The Problem**
Forms are hard:
- State management (controlled vs uncontrolled)
- Validation (client-side)
- Error handling
- Performance (re-renders)
- Type safety

### **Alternatives:**

| Solution | Approach | Performance | Features |
|----------|----------|-------------|----------|
| **React Hook Form** | Uncontrolled | ⚡ Excellent | ✅ Full-featured |
| **Formik** | Controlled | ⚠️ Slow | ✅ Full-featured |
| **React Final Form** | Subscription | ✅ Good | ✅ Full-featured |
| **Vanilla React** | Manual | ⚡ Excellent | ❌ DIY everything |

### **Why React Hook Form?**

**1. Performance**
```typescript
// Formik (controlled):
const formik = useFormik({
  initialValues: { name: '', email: '', password: '' },
  onSubmit: handleSubmit
})

<input
  value={formik.values.name}  // ❌ Re-renders on every keystroke
  onChange={formik.handleChange}
/>

// Result:
// - Type "hello" = 5 re-renders
// - 10 fields = 10x worse
// - Typing feels laggy

// React Hook Form (uncontrolled):
const { register, handleSubmit } = useForm()

<input {...register('name')} />  // ✅ No re-renders!

// Result:
// - Type "hello" = 0 re-renders (until submit/blur)
// - Instant feedback
// - Smooth UX
```

**Real Benchmark:**
```yaml
Form with 20 fields, type 100 characters:

Formik:
  - Total re-renders: 2,000
  - Time: ~800ms
  - Feels: Laggy

React Hook Form:
  - Total re-renders: 0
  - Time: ~0ms
  - Feels: Instant
```

**2. Bundle Size**
```yaml
Formik: ~15kb (minified + gzipped)
React Hook Form: ~9kb
React Final Form: ~12kb

Winner: React Hook Form
```

**3. API Design**
```typescript
// React Hook Form has the best DX:
const {
  register,        // Connect inputs
  handleSubmit,    // Submit handler
  formState: { errors },  // Error state
  watch,           // Watch fields
  setValue,        // Programmatic updates
  reset            // Reset form
} = useForm()

// Register input (3 ways):
<input {...register('email')} />  // Simple
<input {...register('email', { required: true })} />  // With validation
<Controller name="select" control={control} />  // For third-party
```

**4. Zod Integration**
```typescript
// Define schema once:
const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Min 6 characters'),
  age: z.number().min(18, 'Must be 18+')
})

type FormData = z.infer<typeof schema>  // Auto TypeScript types!

// Use in form:
const { register, handleSubmit } = useForm<FormData>({
  resolver: zodResolver(schema)  // Automatic validation
})

// Benefits:
// ✅ Type-safe forms
// ✅ Runtime validation
// ✅ DRY (one schema)
// ✅ Reuse for API validation
```

**5. Why Zod?**

**Alternatives:**
- **Yup**: Most popular, but not TypeScript-first
- **Joi**: Server-side focused, large bundle
- **Manual validation**: Error-prone, repetitive

**Zod Benefits:**
```typescript
// Type inference:
const User = z.object({
  name: z.string(),
  age: z.number()
})

type User = z.infer<typeof User>
// Automatically: { name: string; age: number }

// No duplicate types!

// Server validation (same schema):
app.post('/api/users', async (req, res) => {
  const result = schema.safeParse(req.body)
  if (!result.success) {
    return res.status(400).json(result.error)
  }
  // Type-safe data!
})

// Shared validation between frontend & backend!
```

**Trade-offs:**

**What We Gain:**
- ⚡ Zero re-renders (instant UX)
- 📦 Smaller bundle
- 🎯 Type-safe forms
- 🔄 DRY validation
- ♿ Built-in accessibility

**What We Accept:**
- 📚 Different API than Formik
- 🧠 Uncontrolled paradigm (shift in thinking)

**Verdict**: React Hook Form + Zod is the modern standard. Performance and type safety are critical for forms.

---

## 6. Animations: Framer Motion

### **Decision**: Framer Motion 11+

### **Alternatives:**

| Library | Type | Pros | Cons |
|---------|------|------|------|
| **Framer Motion** | Declarative | ✅ React-first<br>✅ Gestures<br>✅ Layout animations | 📦 ~30kb |
| **GSAP** | Imperative | ✅ Powerful<br>✅ Timeline | ❌ Not React-friendly<br>📦 ~50kb |
| **React Spring** | Physics-based | ✅ Realistic motion | ❌ Complex API<br>⚠️ Overkill |
| **CSS Animations** | Native | ✅ Lightweight<br>✅ Fast | ❌ Limited control<br>❌ No gestures |

### **Why Framer Motion?**

**1. React-First API**
```typescript
// GSAP (imperative):
useEffect(() => {
  gsap.to('.box', { x: 100, duration: 1 })
}, [])
// ❌ Refs, side effects, cleanup

// Framer Motion (declarative):
<motion.div
  initial={{ x: 0 }}
  animate={{ x: 100 }}
  transition={{ duration: 1 }}
/>
// ✅ Just props!
```

**2. Layout Animations**
```typescript
// CSS can't do this:
<motion.div layout>
  {/* Auto-animates position/size changes */}
</motion.div>

// Example: Grid to list view
{view === 'grid' ? (
  <motion.div layout className="grid grid-cols-3">
) : (
  <motion.div layout className="flex flex-col">
)}
// Smoothly animates the transition!
```

**3. Gestures**
```typescript
<motion.div
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
  drag
  dragConstraints={{ left: 0, right: 300 }}
>
  Drag me!
</motion.div>

// Would take 100+ lines with vanilla JS
```

**4. Variants (Orchestration)**
```typescript
const list = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1  // Animate children in sequence
    }
  }
}

const item = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

<motion.ul variants={list} initial="hidden" animate="visible">
  {items.map(item => (
    <motion.li variants={item}>{item}</motion.li>
  ))}
</motion.ul>

// Automatic stagger effect!
```

**Trade-offs:**

**What We Gain:**
- 🎯 Declarative API (fits React)
- 🎨 Layout animations
- 👆 Gesture support
- 🎭 Advanced orchestration

**What We Accept:**
- 📦 ~30kb bundle (worth it)
- 📚 Learning curve

**When to use CSS instead:**
```typescript
// Simple transitions: Use CSS
.button {
  transition: background 0.2s;
}

// Complex animations: Use Framer Motion
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -20 }}
/>
```

**Verdict**: Framer Motion is worth the bundle size. Animations are critical for modern UX, and CSS alone isn't enough.

---

## 7. TypeScript: Strict Mode

### **Decision**: TypeScript with `strict: true`

### **Why TypeScript?**

This is almost a non-decision in 2024:
- ✅ Industry standard
- ✅ Catches bugs before runtime
- ✅ Better IDE support
- ✅ Self-documenting code
- ✅ Refactoring confidence

### **Why Strict Mode?**

```json
{
  "compilerOptions": {
    "strict": true  // Enables all strict checks
  }
}
```

**What strict mode enables:**

1. **noImplicitAny**
```typescript
// Without strict:
function add(a, b) {  // ✅ Compiles (any by default)
  return a + b
}
add("1", "2")  // "12" (bug!)

// With strict:
function add(a, b) {  // ❌ Error: Parameter 'a' implicitly has 'any' type
  return a + b
}

function add(a: number, b: number) {  // ✅ Must specify types
  return a + b
}
add("1", "2")  // ❌ Error: Argument of type 'string' not assignable
```

2. **strictNullChecks**
```typescript
// Without strict:
const user = users.find(u => u.id === 1)
console.log(user.name)  // ✅ Compiles (might crash!)

// With strict:
const user = users.find(u => u.id === 1)
console.log(user.name)  // ❌ Error: 'user' is possibly 'undefined'

// Must handle:
console.log(user?.name)  // ✅ Safe
if (user) {
  console.log(user.name)  // ✅ Safe
}
```

3. **strictFunctionTypes**
```typescript
// Prevents type-unsafe function assignments
```

**Trade-offs:**

**What We Gain:**
- 🐛 Catch more bugs at compile time
- 🔒 Better type safety
- 📖 Better code documentation
- 🛡️ Safer refactoring

**What We Accept:**
- ⌨️ More type annotations
- 📚 Steeper learning curve
- 🔧 Can't ignore errors easily

**Verdict**: Strict mode is non-negotiable. The bugs it catches are worth the extra typing.

---

## 8. Routing: React Router v6

### **Decision**: React Router v6 with loader pattern

### **Alternatives:**

| Router | Type | Pros | Cons |
|--------|------|------|------|
| **React Router** | Client-side | ✅ Industry standard<br>✅ Most flexible<br>✅ Data loaders | ⚠️ No SSR |
| **Next.js** | Full framework | ✅ SSR/SSG<br>✅ File-based routing | ❌ Opinionated<br>❌ Server required |
| **Tanstack Router** | Type-safe | ✅ Full type safety | 🆕 New, smaller ecosystem |
| **Wouter** | Minimal | ✅ Tiny bundle | ❌ Limited features |

### **Why React Router v6?**

**1. Loader Pattern** (Game-changer)
```typescript
// Old way (fetch in component):
function ProductPage() {
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProduct().then(setProduct).finally(() => setLoading(false))
  }, [])

  if (loading) return <Spinner />
  return <div>{product.name}</div>
}

// New way (fetch before render):
export const productLoader = async ({ params }) => {
  return fetchProduct(params.id)
}

function ProductPage() {
  const product = useLoaderData()  // Already loaded!
  return <div>{product.name}</div>
}

// Route config:
{
  path: '/products/:id',
  element: <ProductPage />,
  loader: productLoader  // Runs BEFORE render
}

// Benefits:
// ✅ No loading states needed
// ✅ Data ready on render
// ✅ Better UX (no flash of loading)
// ✅ Prefetch on hover
```

**2. Error Boundaries Per Route**
```typescript
{
  path: '/products/:id',
  element: <ProductPage />,
  errorElement: <ProductError />,  // Scoped error boundary
  loader: productLoader
}

// If loader fails, only this route shows error
// Rest of app keeps working!
```

**3. Nested Routes**
```typescript
{
  path: '/dashboard',
  element: <DashboardLayout />,  // Shared layout
  children: [
    { path: 'products', element: <Products /> },
    { path: 'orders', element: <Orders /> },
    { path: 'analytics', element: <Analytics /> }
  ]
}

// Layout persists, only content changes
// No re-mounting, better performance
```

**Trade-offs:**

**What We Gain:**
- 🚀 Data before render
- 🎯 Per-route error handling
- 📦 Code splitting by route
- ⚡ Prefetching support

**What We Accept:**
- 📚 New patterns to learn
- ⚠️ Client-side only (no SSR)

**Verdict**: React Router v6 is the standard for client-side React apps. The loader pattern is a huge UX improvement.

---

## 9. Testing: Vitest vs Jest

### **Decision**: Vitest + Testing Library

### **Why Not Jest?**

Jest has been the standard, but:

| Feature | Jest | Vitest |
|---------|------|--------|
| **Speed** | Slow | ⚡ 10x faster |
| **Config** | Complex | ✅ Zero config with Vite |
| **ESM** | Poor support | ✅ Native ESM |
| **Watch mode** | Slow | ⚡ Instant |
| **API** | Jest API | ✅ Jest-compatible |

### **Why Vitest?**

**1. Speed**
```yaml
Run 100 tests:
  Jest: ~15 seconds
  Vitest: ~1.5 seconds

  10x faster!
```

**2. Vite Integration**
```typescript
// Jest requires:
// - babel config
// - jest config
// - module mocks setup
// - ESM workarounds

// Vitest:
// - Just works with Vite config
// - No additional setup
```

**3. Watch Mode**
```yaml
Change a file:
  Jest: Re-runs all tests (~5s)
  Vitest: Only affected tests (~200ms)

  25x faster feedback!
```

**4. Compatible API**
```typescript
// Same API as Jest:
import { describe, it, expect } from 'vitest'

describe('CartStore', () => {
  it('adds items', () => {
    expect(cartStore.items).toHaveLength(0)
  })
})

// Easy migration from Jest!
```

**Trade-offs:**

**What We Gain:**
- ⚡ 10x faster tests
- ✅ Zero config
- 🔄 Better watch mode
- 🆕 Modern ESM support

**What We Accept:**
- 🆕 Newer (less Stack Overflow)
- 🔌 Smaller ecosystem (growing)

**Verdict**: Vitest is the modern choice. Speed alone justifies it.

---

## 10. Package Manager

### **Decision**: npm (default)

**Quick comparison:**

| Manager | Speed | Disk | Compatibility |
|---------|-------|------|---------------|
| **npm** | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| **pnpm** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **yarn** | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |

**Why npm?**
- ✅ Built-in (no install needed)
- ✅ Universal compatibility
- ✅ Improved speed (v7+)
- ✅ Most documentation uses npm

**Alternative**: If disk space is critical, use pnpm (saves ~50% disk space).

**Verdict**: npm is fine. Not worth the complexity of switching unless you have specific needs.

---

## 🎯 Summary of Decisions

| Category | Choice | Main Reason |
|----------|--------|-------------|
| **Build Tool** | Vite | 10-100x faster DX |
| **Server State** | TanStack Query | Built for the job |
| **Client State** | Zustand | Simple, powerful |
| **Auth State** | Context | Security, lifecycle |
| **UI Components** | shadcn/ui | Full control, accessible |
| **Styling** | Tailwind | Performance, consistency |
| **Forms** | React Hook Form + Zod | Performance, type-safety |
| **Animations** | Framer Motion | Declarative, powerful |
| **TypeScript** | Strict mode | Catch more bugs |
| **Routing** | React Router v6 | Loader pattern |
| **Testing** | Vitest | 10x faster |

---

## 🔄 When to Reconsider

These decisions are right for **most** e-commerce apps. Reconsider if:

- **Need SSR**: Use Next.js instead of React + Vite
- **Need React Native**: Use Expo + React Navigation
- **Large team, complex state**: Consider Redux Toolkit
- **GraphQL API**: Consider Apollo Client instead of TanStack Query
- **Extremely simple app**: Consider removing some layers

---

## 📚 Further Reading

- [Vite: Why Vite](https://vitejs.dev/guide/why.html)
- [TanStack Query: Motivation](https://tanstack.com/query/latest/docs/react/overview#motivation)
- [Zustand vs Redux](https://docs.pmnd.rs/zustand/getting-started/comparison)
- [shadcn/ui Philosophy](https://ui.shadcn.com/docs)
- [Tailwind: Utility-First](https://tailwindcss.com/docs/utility-first)
- [React Hook Form: Performance](https://react-hook-form.com/#motivation)
- [Zod: TypeScript-first](https://zod.dev/)

---

**This document will be updated as we make new decisions or learn from production.**

**Last Updated**: November 2024
**Next Review**: After Phase 1 completion
