<!-- Powered by BMAD™ Core -->

# TypeScript Error Analysis Task

## Purpose
Systematic analysis and resolution of TypeScript errors in Next.js applications, with focus on root cause identification and prevention strategies.

## Task Metadata
```yaml
task-id: typescript-error-analysis
owner: debug-architect
elicit: true
input-required:
  - error_message: Full TypeScript error message
  - error_location: File path and line number
  - reproduction_steps: Steps to reproduce the error
  - environment: Development, build, or runtime environment
output-deliverable: Comprehensive error analysis report with fix and prevention strategy
```

## Prerequisites
- Access to full error stack trace
- Ability to reproduce the error
- TypeScript configuration files (tsconfig.json)
- Relevant source files

## Workflow

### Phase 1: Error Collection and Context Gathering

**ELICITATION REQUIRED:**

```
Please provide the following information about the TypeScript error:

1. **Full Error Message**:
   [Paste complete error message including error code if available]

2. **Error Location**:
   - File: [file path]
   - Line: [line number]
   - Column: [column number if available]

3. **When Does It Occur?**:
   [ ] During development (in IDE)
   [ ] During build process (next build)
   [ ] At runtime (browser/server)
   [ ] During testing
   [ ] Other: ___________

4. **Reproduction Steps**:
   [Describe exact steps to reproduce the error]

5. **Recent Changes**:
   [What code changes were made before this error appeared?]

6. **Environment Details**:
   - TypeScript version: ___________
   - Next.js version: ___________
   - Node.js version: ___________
   - Package manager: ___________
```

**HALT UNTIL USER PROVIDES ABOVE INFORMATION**

---

### Phase 2: Initial Error Classification

Based on the error message, classify the error type:

**Common TypeScript Error Categories:**

1. **Type Mismatch Errors** (TS2322, TS2345, TS2344)
   - Expected type X but got type Y
   - Argument type mismatch
   - Generic type constraint violations

2. **Property/Method Errors** (TS2339, TS2551, TS2554)
   - Property does not exist on type
   - Missing properties in object literals
   - Incorrect number of arguments

3. **Import/Export Errors** (TS2307, TS2305, TS1208)
   - Cannot find module
   - Module has no exported member
   - Named/default import issues

4. **Type Inference Errors** (TS2345, TS7006, TS7053)
   - Implicit 'any' type
   - Type inference too wide/narrow
   - Index signature errors

5. **React/Next.js Specific Errors**
   - Component props type errors
   - Server/client component boundary issues
   - Hydration type mismatches
   - getServerSideProps/getStaticProps return type errors

6. **Build/Configuration Errors**
   - tsconfig.json misconfiguration
   - Module resolution issues
   - Path mapping problems

**Document Classification:**
```
ERROR CATEGORY: [Category from above]
ERROR CODE: [TS#### if available]
SEVERITY: [Critical/High/Medium/Low]
IMPACT: [Build Failure/Runtime Error/IDE Warning/Type Safety]
```

---

### Phase 3: Root Cause Analysis

#### Step 1: Examine Error Context

1. **Read the problematic file** at the error location
2. **Identify the immediate cause** (what TypeScript is complaining about)
3. **Trace type definitions** involved in the error
4. **Check related files** that might contribute to the issue

#### Step 2: Analyze Type Flow

For type mismatch errors:
```typescript
// Track the type flow:
// 1. Where is the value defined?
// 2. What type is it assigned?
// 3. How does it flow through the code?
// 4. Where does the type expectation come from?
// 5. Why is there a mismatch?
```

Create a type flow diagram:
```
SOURCE TYPE → TRANSFORMATIONS → EXPECTED TYPE
Example:
string (API response) → JSON.parse() → any → Expected: User
                                              ↑
                                        ERROR HERE: Missing type validation
```

#### Step 3: Identify Root Cause vs Symptoms

**Ask the Five Whys:**
1. Why did the error occur? (Surface symptom)
2. Why did that happen? (Intermediate cause)
3. Why did that happen? (Deeper cause)
4. Why did that happen? (Root architectural issue)
5. Why did that happen? (Process/pattern gap)

**Document Root Cause:**
```
SYMPTOM: [What TypeScript reported]
IMMEDIATE CAUSE: [What code triggered it]
UNDERLYING CAUSE: [Why that code exists]
ROOT CAUSE: [Architectural/pattern issue]
CONTRIBUTING FACTORS: [Environmental, config, dependency issues]
```

---

### Phase 4: Solution Design

#### Step 1: Evaluate Fix Options

Present **3 solution approaches** (quick fix, proper fix, architectural fix):

**OPTION 1: Immediate Fix (Quick)**
```typescript
// What: [Brief description]
// Pros: [Benefits]
// Cons: [Tradeoffs/technical debt]
// Code example:
[Show minimal code change]
```

**OPTION 2: Proper Fix (Recommended)**
```typescript
// What: [Brief description]
// Pros: [Benefits]
// Cons: [Tradeoffs]
// Code example:
[Show proper implementation]
```

**OPTION 3: Architectural Fix (Long-term)**
```typescript
// What: [Brief description]
// Pros: [Benefits]
// Cons: [Effort required]
// Code example:
[Show architectural pattern]
```

**ELICITATION REQUIRED:**
```
Which solution approach would you like to implement?

1. Immediate Fix (Quick)
2. Proper Fix (Recommended)
3. Architectural Fix (Long-term)
4. Combination: [Specify which parts]

Your choice: _____

Rationale: ___________
```

**HALT UNTIL USER SELECTS APPROACH**

---

### Phase 5: Implementation

#### Step 1: Implement the Fix

Based on user's selected approach, implement the solution:

1. **Make code changes** with clear comments explaining why
2. **Update type definitions** if needed
3. **Add type guards or validation** where appropriate
4. **Update imports/exports** if module structure changed

#### Step 2: Verify Type Safety

Run type checking:
```bash
# Check specific file
npx tsc --noEmit [file-path]

# Check entire project
npx tsc --noEmit

# Run with strict mode
npx tsc --noEmit --strict
```

Document results:
```
TYPE CHECK RESULTS:
✓ Errors resolved: [count]
✓ New warnings: [count]
✓ Type safety level: [Improved/Maintained/Degraded]
```

#### Step 3: Test the Fix

Create test cases:

```typescript
// Test 1: Happy path
describe('[Feature] - Type Error Fix', () => {
  it('should handle correct types without errors', () => {
    // Test implementation
  });

  // Test 2: Edge cases
  it('should handle edge cases with proper type safety', () => {
    // Test implementation
  });

  // Test 3: Error conditions
  it('should provide type-safe error handling', () => {
    // Test implementation
  });
});
```

Run tests:
```bash
npm test -- [test-file]
npm run lint
```

---

### Phase 6: Prevention Strategy

#### Document Prevention Measures

**1. Code-Level Prevention:**
```typescript
// Example: Add utility types to prevent this class of errors
type SafeType<T> = {
  // Type utility implementation
};

// Example: Create validation helper
function validateType(value: unknown): value is ExpectedType {
  // Type guard implementation
}
```

**2. Configuration Prevention:**
```json
// tsconfig.json additions to catch similar errors
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    // Add relevant strict flags
  }
}
```

**3. Linting Rules:**
```javascript
// .eslintrc.js additions
module.exports = {
  rules: {
    // Add TypeScript ESLint rules to catch similar issues
  }
};
```

**4. Team Guidelines:**
```markdown
## Pattern to Avoid
[Show anti-pattern that caused the error]

## Recommended Pattern
[Show correct pattern]

## When to Use
[Explain when this pattern applies]

## Example
[Show concrete example]
```

---

### Phase 7: Documentation and Knowledge Sharing

#### Create Error Resolution Report

```markdown
# TypeScript Error Resolution: [Brief Title]

## Error Summary
- **Error Code**: TS####
- **Category**: [Category]
- **Severity**: [Severity]
- **Date Resolved**: [Date]
- **Resolved By**: [Name/Team]

## Problem Description
[Describe what was happening]

### Error Message
```
[Full error message]
```

### Reproduction Steps
1. [Step 1]
2. [Step 2]
3. [Step 3]

## Root Cause Analysis
**Symptom**: [What appeared to be wrong]
**Root Cause**: [What actually was wrong]
**Why It Happened**: [Explanation]

## Solution Implemented
[Describe the fix]

### Code Changes
[Link to commit or PR]

### Files Modified
- [file1.ts] - [What changed]
- [file2.ts] - [What changed]

## Prevention Strategy
1. [Prevention measure 1]
2. [Prevention measure 2]
3. [Prevention measure 3]

## Tests Added
- [Test 1 description]
- [Test 2 description]

## Team Learnings
**Key Takeaways:**
1. [Learning 1]
2. [Learning 2]
3. [Learning 3]

**Recommended Practices:**
- [Practice 1]
- [Practice 2]

## Related Issues
- [Link to related issues]
- [Link to similar past issues]

## References
- [TypeScript documentation]
- [Next.js documentation]
- [Internal guidelines]
```

---

## Output Deliverables

Upon completion, provide:

1. ✅ **Error Analysis Report** (as documented above)
2. ✅ **Fixed Code** with explanatory comments
3. ✅ **Test Cases** that verify the fix
4. ✅ **Prevention Guidelines** for the team
5. ✅ **Knowledge Base Entry** for future reference

---

## Success Criteria

- [ ] Error is completely resolved (no TypeScript errors)
- [ ] Type safety is maintained or improved
- [ ] Tests pass including new test cases
- [ ] Linting passes with no new warnings
- [ ] Build completes successfully
- [ ] Solution is documented for team
- [ ] Prevention measures are in place
- [ ] User understands the root cause and fix

---

## Common Pitfalls to Avoid

❌ **Using 'any' type** to silence errors without understanding root cause
❌ **Type assertions ('as')** without validation
❌ **Fixing symptom** without addressing root cause
❌ **Skipping tests** for the fix
❌ **Not documenting** the solution for team
❌ **Ignoring prevention** opportunities
❌ **Complex solutions** when simple ones exist

---

## Next Steps After Task Completion

1. **Share knowledge** with team (demo or documentation)
2. **Update team guidelines** if new pattern discovered
3. **Create reusable utilities** if applicable
4. **Schedule code review** for the fix
5. **Monitor** for similar issues in other parts of codebase

---

**Task Complete When:**
- All success criteria checkboxes are marked
- User confirms understanding and satisfaction
- Documentation is added to knowledge base
