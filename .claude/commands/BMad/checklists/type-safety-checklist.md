<!-- Powered by BMAD™ Core -->

# TypeScript Type Safety Checklist

## Purpose
Ensure maximum type safety and prevent common TypeScript pitfalls in your codebase.

---

## TypeScript Configuration

### tsconfig.json Strict Mode
- [ ] `"strict": true` is enabled
- [ ] `"noImplicitAny": true` - No implicit any types
- [ ] `"strictNullChecks": true` - Null/undefined handling
- [ ] `"strictFunctionTypes": true` - Strict function types
- [ ] `"strictBindCallApply": true` - Strict bind/call/apply
- [ ] `"strictPropertyInitialization": true` - Class property init
- [ ] `"noImplicitThis": true` - No implicit this
- [ ] `"alwaysStrict": true` - Parse in strict mode

### Additional Strict Checks
- [ ] `"noUnusedLocals": true` - Flag unused variables
- [ ] `"noUnusedParameters": true` - Flag unused parameters
- [ ] `"noImplicitReturns": true` - All code paths return
- [ ] `"noFallthroughCasesInSwitch": true` - Switch exhaustiveness
- [ ] `"noUncheckedIndexedAccess": true` - Safe index access
- [ ] `"noPropertyAccessFromIndexSignature": true` - Explicit access
- [ ] `"exactOptionalPropertyTypes": true` - Precise optionals
- [ ] `"allowUnusedLabels": false` - No unused labels
- [ ] `"allowUnreachableCode": false` - No dead code

### Module and Resolution
- [ ] `"moduleResolution": "bundler"` or `"node"` appropriately set
- [ ] `"esModuleInterop": true` for better import compatibility
- [ ] `"resolveJsonModule": true` if importing JSON
- [ ] `"isolatedModules": true` for build tool compatibility
- [ ] Path aliases configured in `paths` if needed
- [ ] `"baseUrl"` set correctly for path resolution

---

## Type Definitions

### Interface and Type Design
- [ ] Interfaces used for object shapes that may be extended
- [ ] Types used for unions, intersections, and mapped types
- [ ] Descriptive names that indicate purpose
- [ ] Readonly properties where data shouldn't change
- [ ] Optional properties marked with `?` appropriately
- [ ] No redundant or duplicate type definitions
- [ ] Exported types are in appropriate `.d.ts` or module files

### Advanced Type Patterns
- [ ] Discriminated unions for variant types
- [ ] Branded types for primitive type safety
- [ ] Template literal types for string patterns
- [ ] Conditional types used appropriately
- [ ] Mapped types for transformations
- [ ] Utility types leveraged (Partial, Pick, Omit, etc.)
- [ ] Generic constraints properly specified

### Type vs Any/Unknown
- [ ] No usage of `any` type (or documented exception)
- [ ] `unknown` used instead of `any` for unknown types
- [ ] Type guards implemented to narrow `unknown`
- [ ] Type assertions minimized and justified
- [ ] Non-null assertions (`!`) avoided or documented

---

## Function Type Safety

### Function Signatures
- [ ] All parameters have explicit types
- [ ] Return types explicitly declared (not inferred)
- [ ] Optional parameters marked with `?`
- [ ] Rest parameters typed with array types
- [ ] Async functions return `Promise<T>`
- [ ] Callback parameters have proper function signatures
- [ ] Generic functions have appropriate constraints

### Function Implementation
- [ ] No implicit `any` in function parameters
- [ ] All code paths have explicit return statements
- [ ] Return types match declared type
- [ ] Error handling typed appropriately
- [ ] Pure functions don't mutate inputs
- [ ] Side effects documented in comments

### Type Guards
- [ ] Custom type guards use `is` keyword
- [ ] Type predicates are accurate
- [ ] Exhaustive checks for discriminated unions
- [ ] Runtime validation matches type guards
- [ ] Type guards properly narrow union types

```typescript
// ✅ Good type guard example
function isUser(value: unknown): value is User {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'name' in value &&
    typeof value.id === 'string' &&
    typeof value.name === 'string'
  );
}
```

---

## React/Next.js Type Safety

### Component Props
- [ ] All component props have interface/type definition
- [ ] Props interface is exported for reuse
- [ ] Optional props marked with `?`
- [ ] Children typed appropriately (`React.ReactNode`)
- [ ] Event handlers typed with React event types
- [ ] Ref props typed with appropriate ref types
- [ ] Generic components properly constrained

### Hooks Type Safety
- [ ] `useState` has explicit type if not inferred correctly
- [ ] `useReducer` has typed state and actions
- [ ] `useContext` has typed context value
- [ ] `useRef` has correct ref type
- [ ] Custom hooks have proper return types
- [ ] Hook dependencies typed correctly

### Next.js Specific
- [ ] Page props typed with `PageProps` interface
- [ ] `getServerSideProps` return type correct
- [ ] `getStaticProps` return type correct
- [ ] API route handlers typed correctly
- [ ] Middleware has proper Request/Response types
- [ ] Server Actions typed with proper parameters
- [ ] Params and searchParams typed in app router

---

## API and Data Type Safety

### API Request/Response
- [ ] API request bodies have type definitions
- [ ] API response types defined
- [ ] Error response types defined
- [ ] Validation schema matches TypeScript types
- [ ] API client methods properly typed
- [ ] Fetch/Axios responses typed correctly

### Data Validation
- [ ] Runtime validation with Zod or similar
- [ ] Validation schemas match TypeScript types
- [ ] Parse results checked before use
- [ ] Invalid data handled gracefully
- [ ] Validation errors typed and handled

```typescript
// ✅ Good validation example
import { z } from 'zod';

const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
});

type User = z.infer<typeof UserSchema>;

async function fetchUser(id: string): Promise<User> {
  const response = await fetch(`/api/users/${id}`);
  const data = await response.json();
  return UserSchema.parse(data); // Validates at runtime
}
```

### Database Type Safety
- [ ] Prisma/ORM types generated and imported
- [ ] Query results typed correctly
- [ ] Database models match TypeScript types
- [ ] Transactions typed properly
- [ ] Migration types updated

---

## Error Handling Type Safety

### Try-Catch Blocks
- [ ] Caught errors typed appropriately
- [ ] Error objects checked before accessing properties
- [ ] Custom error classes defined with types
- [ ] Error handling doesn't use `any`
- [ ] Errors logged with proper types

```typescript
// ✅ Good error handling
try {
  await riskyOperation();
} catch (error) {
  if (error instanceof CustomError) {
    console.error('Custom error:', error.code);
  } else if (error instanceof Error) {
    console.error('Error:', error.message);
  } else {
    console.error('Unknown error:', String(error));
  }
}
```

### Result Types
- [ ] Consider using Result<T, E> pattern for operations that can fail
- [ ] Typed errors preferred over throwing
- [ ] Optional types used instead of null where appropriate

---

## Generic Type Safety

### Generic Functions
- [ ] Generic parameters have descriptive names (not just `T`)
- [ ] Constraints specified where needed
- [ ] Default generic types provided if appropriate
- [ ] Multiple generics properly related
- [ ] Generic return types properly inferred

### Generic Components
- [ ] Component generics properly constrained
- [ ] Props typed with generic parameters
- [ ] Children typed appropriately with generics
- [ ] Ref forwarding typed correctly with generics

---

## Array and Object Type Safety

### Arrays
- [ ] Array types explicitly declared `Type[]` or `Array<Type>`
- [ ] No mixed-type arrays (use union types if needed)
- [ ] Array methods return properly typed results
- [ ] Readonly arrays used where appropriate
- [ ] Tuple types used for fixed-length arrays

### Objects
- [ ] Index signatures typed appropriately
- [ ] Record<K, V> used for key-value maps
- [ ] Object destructuring maintains types
- [ ] Spread operations maintain types
- [ ] Object.keys/values/entries handled type-safely

```typescript
// ✅ Type-safe object handling
const config: Record<string, string> = {
  api: 'https://api.example.com',
};

// Type guard for safe key access
function isValidConfigKey(key: string): key is keyof typeof config {
  return key in config;
}

const key = 'api';
if (isValidConfigKey(key)) {
  console.log(config[key]); // Type-safe
}
```

---

## Third-Party Library Type Safety

### Type Definitions
- [ ] @types packages installed for libraries without built-in types
- [ ] Type definitions are up to date
- [ ] No `any` fallback for untyped libraries
- [ ] Custom type declarations created if needed
- [ ] Module augmentation used to extend types

### Library Usage
- [ ] Library methods used with correct types
- [ ] Library return values properly typed
- [ ] Callbacks typed according to library
- [ ] Configuration objects typed correctly

---

## Testing Type Safety

### Test Code
- [ ] Test functions properly typed
- [ ] Mock data matches production types
- [ ] Test utilities are type-safe
- [ ] Assertions check types when possible
- [ ] Test fixtures have proper types

---

## Code Quality

### Type Assertions
- [ ] Type assertions (`as`) used sparingly
- [ ] Each assertion has comment explaining why
- [ ] Safer alternatives considered first
- [ ] Non-null assertions (`!`) avoided or justified
- [ ] Const assertions used where appropriate

### Type Narrowing
- [ ] typeof checks used for primitive narrowing
- [ ] instanceof checks used for class narrowing
- [ ] in operator used for property checking
- [ ] Discriminated unions properly narrowed
- [ ] Control flow properly narrows types

### Documentation
- [ ] Complex types have JSDoc comments
- [ ] Type parameters documented
- [ ] Union types explain each option
- [ ] Type utilities have usage examples
- [ ] Breaking type changes documented

---

## Performance Considerations

### Type Complexity
- [ ] Avoid deeply nested conditional types
- [ ] Recursive types have depth limits
- [ ] Mapped types are reasonably sized
- [ ] Union types are manageable in size
- [ ] Type inference doesn't cause slow compilation

### Build Performance
- [ ] `skipLibCheck: true` considered for faster builds
- [ ] Incremental compilation enabled
- [ ] Project references used for monorepos
- [ ] Type checking separated from bundling if slow

---

## ESLint Rules for Type Safety

### Recommended Rules
- [ ] `@typescript-eslint/no-explicit-any` enabled
- [ ] `@typescript-eslint/no-unsafe-assignment` enabled
- [ ] `@typescript-eslint/no-unsafe-member-access` enabled
- [ ] `@typescript-eslint/no-unsafe-call` enabled
- [ ] `@typescript-eslint/no-unsafe-return` enabled
- [ ] `@typescript-eslint/strict-boolean-expressions` enabled
- [ ] `@typescript-eslint/no-floating-promises` enabled
- [ ] `@typescript-eslint/await-thenable` enabled

---

## Migration and Refactoring

### When Improving Types
- [ ] Identify high-risk areas first
- [ ] Make incremental improvements
- [ ] Run type checks after each change
- [ ] Update tests to match new types
- [ ] Document breaking changes
- [ ] Communicate changes to team

---

## Sign-off

**Reviewer**: _________________
**Date**: _________________
**Type Coverage**: _____%
**TypeScript Version**: _________________

---

## Additional Notes

_Document any exceptions, special considerations, or team-specific guidelines:_
