<!-- Powered by BMAD™ Core -->

# TypeScript/Next.js Debugging Checklist

## Purpose
Comprehensive checklist for systematic debugging of TypeScript and Next.js issues to ensure thorough investigation and resolution.

---

## Pre-Debugging Setup

### Environment Verification
- [ ] Verified Node.js version matches project requirements
- [ ] Verified npm/yarn/pnpm version is up to date
- [ ] Verified TypeScript version is compatible with project
- [ ] Verified Next.js version and compatibility
- [ ] Checked all dependencies are installed (`node_modules` exists)
- [ ] Reviewed `package.json` for any dependency conflicts
- [ ] Cleared cache (`rm -rf .next node_modules && npm install`)

### Configuration Review
- [ ] Reviewed `tsconfig.json` for correct settings
- [ ] Reviewed `next.config.js` for custom configurations
- [ ] Checked environment variables are set (`.env.local`)
- [ ] Verified path aliases are correctly configured
- [ ] Checked ESLint configuration (`.eslintrc`)
- [ ] Reviewed Prettier configuration if applicable

### Source Control
- [ ] Confirmed current branch and recent changes
- [ ] Checked if issue exists in main/master branch
- [ ] Identified when issue first appeared (git bisect if needed)
- [ ] Reviewed recent commits for suspicious changes

---

## Error Collection Phase

### Gather Error Information
- [ ] Captured full error message with stack trace
- [ ] Noted error code (e.g., TS2322) if TypeScript error
- [ ] Identified exact file, line, and column of error
- [ ] Determined when error occurs (dev/build/runtime)
- [ ] Documented steps to reproduce consistently
- [ ] Captured screenshots or video of issue
- [ ] Checked browser console for additional errors
- [ ] Reviewed server logs (terminal output)

### Context Collection
- [ ] Identified recent code changes related to error
- [ ] Checked if issue is intermittent or consistent
- [ ] Noted affected pages/components/routes
- [ ] Identified if issue is environment-specific
- [ ] Reviewed related GitHub issues or Stack Overflow
- [ ] Checked Next.js/TypeScript release notes for breaking changes

---

## TypeScript Error Analysis

### Type System Investigation
- [ ] Read and understood the error message completely
- [ ] Identified the expected type vs actual type
- [ ] Traced where the problematic value originates
- [ ] Checked type definitions (`.d.ts` files)
- [ ] Reviewed interface/type declarations involved
- [ ] Looked for missing or incorrect generic parameters
- [ ] Checked for implicit `any` types
- [ ] Verified import statements are correct

### Common TypeScript Issues
- [ ] Checked for `any` type escapes
- [ ] Looked for unsafe type assertions (`as`, `!`)
- [ ] Verified object property access is type-safe
- [ ] Checked array/tuple type usage
- [ ] Reviewed union/intersection type handling
- [ ] Verified generic constraints are satisfied
- [ ] Checked for circular type references
- [ ] Reviewed conditional type logic

### Type Inference Issues
- [ ] Checked if type widening is occurring unexpectedly
- [ ] Verified type narrowing in conditional blocks
- [ ] Reviewed discriminated union usage
- [ ] Checked if return types need explicit declaration
- [ ] Verified type guards are working correctly
- [ ] Reviewed mapped type transformations

---

## Next.js Specific Debugging

### Build Issues
- [ ] Ran `npm run build` to reproduce
- [ ] Checked build output for warnings
- [ ] Reviewed `.next` folder for generated files
- [ ] Tested with `--debug` flag for verbose output
- [ ] Checked for circular dependencies
- [ ] Verified dynamic imports are configured correctly
- [ ] Reviewed webpack/turbopack configuration
- [ ] Checked for memory issues during build

### Runtime Issues
- [ ] Determined if error is server-side or client-side
- [ ] Checked Network tab for failed requests
- [ ] Reviewed API route implementation
- [ ] Verified middleware execution
- [ ] Checked for hydration mismatches
- [ ] Reviewed data fetching methods (getServerSideProps, etc.)
- [ ] Verified environment variables are accessible
- [ ] Checked for race conditions in async operations

### Server/Client Component Issues (App Router)
- [ ] Verified 'use client' directives are in correct files
- [ ] Checked that Server Components don't use client-only features
- [ ] Verified props passed to Client Components are serializable
- [ ] Reviewed Server Actions have 'use server' directive
- [ ] Checked async Server Components are properly awaited
- [ ] Verified no hooks are used in Server Components
- [ ] Reviewed component boundary separation

### Hydration Debugging
- [ ] Identified content that differs between server/client
- [ ] Checked for date/time rendering differences
- [ ] Looked for random value generation
- [ ] Verified no browser API usage during SSR
- [ ] Checked third-party script interference
- [ ] Reviewed CSS-in-JS library hydration
- [ ] Verified HTML structure validity
- [ ] Used `suppressHydrationWarning` appropriately

---

## Root Cause Analysis

### Systematic Investigation
- [ ] Created minimal reproducible example
- [ ] Isolated the problem to specific code section
- [ ] Used binary search to narrow down issue
- [ ] Applied "5 Whys" technique to find root cause
- [ ] Distinguished between symptom and actual problem
- [ ] Identified contributing factors (environment, config, etc.)
- [ ] Documented hypothesis and tested it

### Code Review
- [ ] Reviewed code logic for correctness
- [ ] Checked for typos or naming mistakes
- [ ] Verified function signatures match usage
- [ ] Reviewed async/await patterns
- [ ] Checked error handling implementation
- [ ] Verified null/undefined checks
- [ ] Reviewed side effects and state mutations

---

## Solution Implementation

### Fix Development
- [ ] Designed fix that addresses root cause (not symptom)
- [ ] Considered multiple solution approaches
- [ ] Evaluated tradeoffs of each approach
- [ ] Selected appropriate solution with rationale
- [ ] Implemented fix with clear code comments
- [ ] Avoided using `any` or unsafe type assertions
- [ ] Maintained or improved type safety
- [ ] Followed project coding standards

### Type Safety Improvements
- [ ] Added proper type definitions
- [ ] Implemented type guards where needed
- [ ] Added runtime validation if necessary
- [ ] Improved generic type usage
- [ ] Removed unsafe type coercions
- [ ] Added JSDoc comments for complex types
- [ ] Updated `.d.ts` files if needed

---

## Testing and Verification

### Type Checking
- [ ] Ran `npx tsc --noEmit` successfully
- [ ] Ran `npx tsc --noEmit --strict` for stricter checking
- [ ] Verified no new TypeScript errors introduced
- [ ] Checked that warnings are acceptable or resolved
- [ ] Ran ESLint to catch additional issues

### Functional Testing
- [ ] Tested fix in development environment
- [ ] Tested all reproduction steps
- [ ] Tested edge cases and boundary conditions
- [ ] Tested error handling paths
- [ ] Verified no console errors or warnings
- [ ] Tested across different browsers
- [ ] Tested on different devices/screen sizes

### Build and Production Testing
- [ ] Successfully ran `npm run build`
- [ ] Tested in production mode (`npm run start`)
- [ ] Verified bundle size is acceptable
- [ ] Ran performance benchmarks
- [ ] Tested in staging environment
- [ ] Verified no runtime errors in production mode

### Automated Testing
- [ ] Created unit tests for the fix
- [ ] Created integration tests if applicable
- [ ] All existing tests still pass
- [ ] Achieved adequate code coverage
- [ ] Tests verify the bug won't return

---

## Performance Verification

### Performance Checks
- [ ] Verified fix doesn't degrade performance
- [ ] Checked bundle size impact
- [ ] Measured page load time
- [ ] Verified no memory leaks introduced
- [ ] Checked for unnecessary re-renders
- [ ] Reviewed network waterfall
- [ ] Ran Lighthouse audit
- [ ] Verified Core Web Vitals

---

## Documentation

### Code Documentation
- [ ] Added comments explaining complex logic
- [ ] Documented why fix was needed (not just what)
- [ ] Updated JSDoc for changed functions
- [ ] Added TODO comments for future improvements
- [ ] Updated type definitions documentation

### Error Resolution Documentation
- [ ] Created error resolution report
- [ ] Documented root cause analysis
- [ ] Explained solution rationale
- [ ] Listed files modified
- [ ] Documented testing performed
- [ ] Added to team knowledge base

### Prevention Documentation
- [ ] Documented prevention strategies
- [ ] Created reusable code patterns
- [ ] Updated team guidelines if needed
- [ ] Added linting rules to prevent recurrence
- [ ] Updated tsconfig.json with stricter checks if applicable
- [ ] Created utility types for common patterns

---

## Knowledge Sharing

### Team Communication
- [ ] Shared findings with relevant team members
- [ ] Created demo or walkthrough if complex
- [ ] Updated team documentation
- [ ] Added entry to error pattern library
- [ ] Conducted knowledge sharing session if needed
- [ ] Updated onboarding materials if applicable

### Code Review
- [ ] Created pull request with clear description
- [ ] Linked to related issues or tickets
- [ ] Requested review from appropriate team members
- [ ] Addressed review feedback
- [ ] Merged after approvals

---

## Post-Resolution

### Monitoring
- [ ] Deployed fix to staging/production
- [ ] Monitored error tracking tools (Sentry, etc.)
- [ ] Verified issue doesn't recur
- [ ] Monitored performance metrics
- [ ] Collected user feedback
- [ ] Set up alerts for similar issues

### Follow-up
- [ ] Identified related code that might have same issue
- [ ] Scheduled refactoring if technical debt created
- [ ] Updated CI/CD pipeline if needed
- [ ] Reviewed and closed related tickets
- [ ] Scheduled retrospective if major issue

---

## Prevention Checklist

### Future Prevention Measures
- [ ] Added TypeScript strict checks to catch similar errors
- [ ] Created ESLint rules to prevent pattern
- [ ] Added pre-commit hooks for validation
- [ ] Updated test suite to cover scenario
- [ ] Created utility functions to prevent issue
- [ ] Updated architecture to eliminate error class
- [ ] Added monitoring/alerting for similar issues
- [ ] Documented anti-patterns to avoid

---

## Checklist Sign-off

**Debugger**: _________________
**Date**: _________________
**Issue ID**: _________________
**Resolution Time**: _________________
**Verification**: [ ] Confirmed fixed in production

---

## Notes

_Use this section for additional context, special considerations, or lessons learned:_

---

**Remember:**
- Systematic approach beats random trial and error
- Document as you go, not after
- Root cause matters more than quick fixes
- Prevention is worth the extra effort
- Share knowledge to help the team grow
