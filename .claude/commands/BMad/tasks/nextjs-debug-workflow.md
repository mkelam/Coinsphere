<!-- Powered by BMAD™ Core -->

# Next.js Debugging Workflow Task

## Purpose
Systematic debugging workflow for Next.js applications covering SSR/SSG issues, hydration errors, API routes, middleware, and build problems.

## Task Metadata
```yaml
task-id: nextjs-debug-workflow
owner: debug-architect
elicit: true
input-required:
  - issue_description: Description of the Next.js issue
  - error_type: Build, runtime, hydration, or performance issue
  - affected_area: Pages, API routes, middleware, components
output-deliverable: Debugged and fixed Next.js application with documentation
```

## Prerequisites
- Next.js project with issue
- Error logs or reproduction steps
- Access to browser DevTools and Next.js debugging tools

## Workflow

### Phase 1: Issue Classification

**ELICITATION REQUIRED:**

```
Please describe the Next.js issue you're experiencing:

1. **Issue Type** (select one):
   [ ] Build failure (next build fails)
   [ ] Development server error (next dev)
   [ ] Runtime error (page loads but crashes)
   [ ] Hydration mismatch
   [ ] API route issue
   [ ] Middleware problem
   [ ] Performance issue
   [ ] Deployment issue
   [ ] Other: ___________

2. **When Does It Occur?**:
   [ ] During development only
   [ ] During build only
   [ ] In production only
   [ ] Across all environments

3. **Affected Area**:
   [ ] Specific page: [page path]
   [ ] API route: [route path]
   [ ] Middleware: [middleware file]
   [ ] Layout/Template
   [ ] Global (all pages)

4. **Error Message or Symptoms**:
   [Paste full error message or describe behavior]

5. **Router Type**:
   [ ] Pages Router (pages/ directory)
   [ ] App Router (app/ directory)
   [ ] Mixed

6. **Reproduction Steps**:
   1. [Step 1]
   2. [Step 2]
   3. [Step 3]
```

**HALT UNTIL USER PROVIDES ABOVE INFORMATION**

---

### Phase 2: Environment Verification

#### Step 1: Check Configuration

Verify Next.js configuration:

```bash
# Check Next.js version
npm list next

# Check Node.js version
node --version

# Review configuration
```

Read and analyze `next.config.js` (or .mjs/.ts):
- [ ] Webpack/Turbopack configuration
- [ ] Environment variables
- [ ] Image configuration
- [ ] Redirects/rewrites
- [ ] Custom server setup

Read and analyze `tsconfig.json`:
- [ ] Module resolution
- [ ] Path aliases
- [ ] Target configuration
- [ ] JSX settings

#### Step 2: Check Dependencies

```bash
# Check for dependency conflicts
npm list

# Check for outdated packages
npm outdated

# Verify peer dependencies
npm ls --depth=0
```

Document findings:
```
CONFIGURATION ISSUES:
- [Issue 1]
- [Issue 2]

DEPENDENCY ISSUES:
- [Issue 1]
- [Issue 2]
```

---

### Phase 3: Issue-Specific Debugging

Based on issue type from Phase 1, follow relevant debugging path:

---

#### PATH A: Build Failure Debugging

**For build failures during `next build`:**

1. **Review Build Output**
   ```bash
   # Clean build
   rm -rf .next
   npm run build -- --debug
   ```

2. **Common Build Issues Checklist**
   - [ ] TypeScript errors (run `tsc --noEmit`)
   - [ ] Import/export errors
   - [ ] Dynamic imports misconfigured
   - [ ] Environment variable issues
   - [ ] Circular dependencies
   - [ ] Image optimization issues
   - [ ] Font loading errors
   - [ ] CSS/Tailwind compilation errors

3. **Analyze Build Logs**
   Look for:
   - Compilation errors
   - Warning messages
   - Failed optimizations
   - Memory issues

4. **Test Incremental Isolation**
   ```bash
   # Try building with specific features disabled
   # In next.config.js:
   module.exports = {
     typescript: {
       ignoreBuildErrors: true, // Temporarily
     },
     eslint: {
       ignoreDuringBuilds: true, // Temporarily
     },
   }
   ```

---

#### PATH B: Hydration Error Debugging

**For hydration mismatch errors:**

1. **Identify Hydration Source**

   Look for error message:
   ```
   Error: Hydration failed because the initial UI does not match what was rendered on the server.
   ```

2. **Common Hydration Causes**
   - [ ] Date/time rendering (server vs client timezone)
   - [ ] Random values (Math.random(), uuid)
   - [ ] Browser-only APIs (window, document, localStorage)
   - [ ] Third-party scripts injecting content
   - [ ] CSS-in-JS libraries
   - [ ] Conditional rendering based on client state
   - [ ] Invalid HTML nesting

3. **Debug Strategy**

   Add debugging to component:
   ```typescript
   'use client'; // If in app router

   import { useEffect, useState } from 'react';

   export default function Component() {
     const [mounted, setMounted] = useState(false);

     useEffect(() => {
       setMounted(true);
     }, []);

     // Option 1: Don't render until mounted
     if (!mounted) {
       return <div>Loading...</div>;
     }

     // Option 2: Render server-safe version first
     return (
       <div suppressHydrationWarning>
         {/* Content that might differ */}
       </div>
     );
   }
   ```

4. **Use React DevTools**
   - Enable hydration warnings in React DevTools
   - Compare server HTML vs client HTML
   - Identify differing elements

5. **Fix Common Patterns**

   **Date/Time:**
   ```typescript
   // ❌ Bad
   const time = new Date().toLocaleString();

   // ✅ Good
   const [time, setTime] = useState('');
   useEffect(() => {
     setTime(new Date().toLocaleString());
   }, []);
   ```

   **Browser APIs:**
   ```typescript
   // ❌ Bad
   const width = window.innerWidth;

   // ✅ Good
   const [width, setWidth] = useState(0);
   useEffect(() => {
     setWidth(window.innerWidth);
   }, []);
   ```

---

#### PATH C: API Route Debugging

**For API route issues:**

1. **Test API Route Directly**
   ```bash
   # Use curl or Postman
   curl -X POST http://localhost:3000/api/your-route \
     -H "Content-Type: application/json" \
     -d '{"test": "data"}'
   ```

2. **Add Logging**
   ```typescript
   // app/api/route/route.ts or pages/api/route.ts
   export async function POST(request: Request) {
     console.log('[API] Received request:', {
       method: request.method,
       url: request.url,
       headers: Object.fromEntries(request.headers),
     });

     try {
       const body = await request.json();
       console.log('[API] Request body:', body);

       // Your logic here
       const result = await yourFunction(body);
       console.log('[API] Result:', result);

       return Response.json(result);
     } catch (error) {
       console.error('[API] Error:', error);
       return Response.json(
         { error: 'Internal server error' },
         { status: 500 }
       );
     }
   }
   ```

3. **Check Common API Issues**
   - [ ] Request method handling (GET, POST, etc.)
   - [ ] Body parsing errors
   - [ ] CORS issues
   - [ ] Authentication/authorization
   - [ ] Database connection
   - [ ] Environment variables
   - [ ] Response format
   - [ ] Error handling

4. **Verify Type Safety**
   ```typescript
   import { NextRequest, NextResponse } from 'next/server';
   import { z } from 'zod';

   const bodySchema = z.object({
     field: z.string(),
   });

   export async function POST(request: NextRequest) {
     try {
       const body = await request.json();
       const validated = bodySchema.parse(body);
       // Now type-safe
     } catch (error) {
       if (error instanceof z.ZodError) {
         return NextResponse.json(
           { error: 'Validation error', details: error.errors },
           { status: 400 }
         );
       }
       throw error;
     }
   }
   ```

---

#### PATH D: Server/Client Component Boundary Issues (App Router)

**For "use client" / "use server" issues:**

1. **Understand Component Types**
   - Server Components (default in app router)
   - Client Components (need 'use client')
   - Server Actions (need 'use server')

2. **Common Boundary Issues**
   - [ ] Using hooks in Server Components
   - [ ] Passing non-serializable props
   - [ ] Event handlers in Server Components
   - [ ] Browser APIs in Server Components
   - [ ] Async Server Component not awaited

3. **Debug Checklist**

   **Issue: "You're importing a component that needs X, but none of its parents have 'use client'"**

   Solution:
   ```typescript
   // Create a client wrapper
   // components/ClientWrapper.tsx
   'use client';

   export function ClientWrapper({ children }: { children: React.ReactNode }) {
     return <>{children}</>;
   }

   // Use it in server component
   import { ClientWrapper } from './ClientWrapper';
   import { ComponentThatNeedsClient } from './ComponentThatNeedsClient';

   export default function Page() {
     return (
       <ClientWrapper>
         <ComponentThatNeedsClient />
       </ClientWrapper>
     );
   }
   ```

   **Issue: Passing functions as props**
   ```typescript
   // ❌ Bad - functions aren't serializable
   <ClientComponent onAction={serverFunction} />

   // ✅ Good - use Server Actions
   // actions.ts
   'use server';
   export async function serverAction() {
     // Server-side logic
   }

   // Client component
   'use client';
   import { serverAction } from './actions';
   export function ClientComponent() {
     return <button onClick={() => serverAction()}>Click</button>;
   }
   ```

---

#### PATH E: Performance Debugging

**For performance issues:**

1. **Measure Performance**
   ```bash
   # Build and analyze bundle
   npm run build

   # Use Next.js analyzer
   npm install --save-dev @next/bundle-analyzer
   ```

   ```javascript
   // next.config.js
   const withBundleAnalyzer = require('@next/bundle-analyzer')({
     enabled: process.env.ANALYZE === 'true',
   });

   module.exports = withBundleAnalyzer({
     // your config
   });
   ```

   ```bash
   # Run analysis
   ANALYZE=true npm run build
   ```

2. **Check Performance Metrics**
   - [ ] Bundle size (check .next/analyze)
   - [ ] Page load time (Chrome DevTools)
   - [ ] Time to First Byte (TTFB)
   - [ ] First Contentful Paint (FCP)
   - [ ] Largest Contentful Paint (LCP)
   - [ ] Cumulative Layout Shift (CLS)

3. **Profile React Components**
   ```bash
   # Enable React profiling in development
   npm run dev
   ```

   Use React DevTools Profiler tab to record and analyze renders

4. **Optimize Common Issues**

   **Code Splitting:**
   ```typescript
   // Use dynamic imports
   import dynamic from 'next/dynamic';

   const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
     loading: () => <div>Loading...</div>,
     ssr: false, // Disable SSR if not needed
   });
   ```

   **Image Optimization:**
   ```typescript
   import Image from 'next/image';

   // ✅ Use Next.js Image component
   <Image
     src="/image.jpg"
     alt="Description"
     width={500}
     height={300}
     priority // For above-the-fold images
   />
   ```

   **Font Optimization:**
   ```typescript
   // app/layout.tsx
   import { Inter } from 'next/font/google';

   const inter = Inter({ subsets: ['latin'] });

   export default function RootLayout({ children }) {
     return (
       <html lang="en" className={inter.className}>
         <body>{children}</body>
       </html>
     );
   }
   ```

---

### Phase 4: Root Cause Documentation

Document findings:

```markdown
## Next.js Debug Report

### Issue Summary
- **Type**: [Issue type]
- **Area**: [Affected area]
- **Severity**: [Critical/High/Medium/Low]

### Root Cause
[Explain what was causing the issue]

### Solution Implemented
[Describe the fix]

### Files Modified
- [file1] - [changes]
- [file2] - [changes]

### Verification Steps
1. [Step 1]
2. [Step 2]
3. [Step 3]

### Prevention
[How to avoid this in the future]

### Performance Impact
- Before: [metrics]
- After: [metrics]
```

---

### Phase 5: Testing and Verification

1. **Development Environment**
   ```bash
   npm run dev
   # Test the fix in development
   ```

2. **Build Process**
   ```bash
   npm run build
   # Ensure build succeeds
   ```

3. **Production Simulation**
   ```bash
   npm run build
   npm run start
   # Test in production mode
   ```

4. **Cross-Browser Testing**
   - [ ] Chrome
   - [ ] Firefox
   - [ ] Safari
   - [ ] Edge

5. **Performance Verification**
   - [ ] Lighthouse score
   - [ ] Bundle size check
   - [ ] Runtime performance

---

## Output Deliverables

1. ✅ **Fixed Next.js application**
2. ✅ **Debug report** documenting issue and solution
3. ✅ **Test cases** to prevent regression
4. ✅ **Performance metrics** before/after
5. ✅ **Team documentation** of lessons learned

---

## Success Criteria

- [ ] Issue is completely resolved
- [ ] Application builds successfully
- [ ] No console errors or warnings
- [ ] Performance meets targets
- [ ] Solution is documented
- [ ] Tests pass
- [ ] User confirms fix

---

**Task Complete When:**
- All success criteria are met
- Documentation is complete
- User validates the fix
