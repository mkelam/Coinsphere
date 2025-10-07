# Accessibility Guidelines (WCAG 2.1 AA Compliance)

**Document Version:** 1.0
**Last Updated:** 2025-10-07
**Owner:** Frontend Team
**Status:** Draft

---

## Table of Contents

1. [Overview](#overview)
2. [WCAG Compliance Levels](#wcag-compliance-levels)
3. [Perceivable](#perceivable)
4. [Operable](#operable)
5. [Understandable](#understandable)
6. [Robust](#robust)
7. [Testing & Validation](#testing--validation)
8. [Common Patterns](#common-patterns)

---

## 1. Overview

**Why Accessibility Matters:**
- **15% of users have disabilities** (WHO estimate)
- **Legal compliance:** ADA, Section 508, EU Web Accessibility Directive
- **Better UX for everyone:** Captions help in noisy environments, keyboard nav is faster for power users
- **SEO benefits:** Semantic HTML improves search rankings

**Target:** WCAG 2.1 Level AA compliance

**Scope:** Web app (MVP), mobile app (v2)

---

## 2. WCAG Compliance Levels

**WCAG 2.1 has 3 conformance levels:**

| Level | Description | Our Target |
|-------|-------------|------------|
| **A** | Minimum level (basic accessibility) | ✅ Must achieve |
| **AA** | Mid-range level (recommended for most sites) | ✅ Must achieve |
| **AAA** | Highest level (not required for most sites) | ❌ Not targeting |

**Our commitment:** Level AA compliance for all public-facing pages

---

## 3. Perceivable

> "Information and user interface components must be presentable to users in ways they can perceive."

### 3.1 Text Alternatives (1.1)

**Guideline:** Provide text alternatives for non-text content

**Implementation:**

**Images:**
```html
<!-- ✅ GOOD: Descriptive alt text -->
<img src="/btc-logo.png" alt="Bitcoin logo">

<!-- ✅ GOOD: Decorative images (empty alt) -->
<img src="/decorative-line.svg" alt="" role="presentation">

<!-- ❌ BAD: Missing alt text -->
<img src="/btc-logo.png">
```

**Icons:**
```html
<!-- ✅ GOOD: Icon with accessible label -->
<button aria-label="Close modal">
  <svg aria-hidden="true"><path d="..."/></svg>
</button>

<!-- ❌ BAD: No label -->
<button>
  <svg><path d="..."/></svg>
</button>
```

**Charts:**
```html
<!-- ✅ GOOD: Provide data table alternative -->
<div role="img" aria-label="Price chart showing 10% increase over 7 days">
  <canvas id="price-chart"></canvas>
</div>

<details class="sr-only">
  <summary>View chart data as table</summary>
  <table>
    <thead>
      <tr><th>Date</th><th>Price</th></tr>
    </thead>
    <tbody>
      <tr><td>2025-10-01</td><td>$45,000</td></tr>
      <!-- ... -->
    </tbody>
  </table>
</details>
```

---

### 3.2 Color Contrast (1.4.3)

**Guideline:** Text must have sufficient contrast ratio

**Minimum contrast ratios:**
- **Normal text:** 4.5:1
- **Large text (18pt+ or 14pt+ bold):** 3:1
- **UI components:** 3:1

**Testing:**
```bash
# Use Lighthouse or WebAIM Color Contrast Checker
# https://webaim.org/resources/contrastchecker/
```

**Color palette (Tailwind):**
```css
/* ✅ GOOD: High contrast (7:1) */
.text-gray-900 { color: #111827; }  /* on white background */
.text-white { color: #ffffff; }  /* on blue-600 background */

/* ⚠️ WARNING: Low contrast (2.8:1 - fails AA) */
.text-gray-400 { color: #9ca3af; }  /* on white background */
```

**Recommendations:**
- Primary text: `text-gray-900` on white (7:1 ratio)
- Secondary text: `text-gray-600` on white (4.6:1 ratio - passes AA)
- Links: `text-blue-600` on white + underline (4.5:1 + distinguishable)

---

### 3.3 Resize Text (1.4.4)

**Guideline:** Text can be resized up to 200% without loss of content or functionality

**Implementation:**
```css
/* ✅ GOOD: Use relative units (rem, em) */
body { font-size: 16px; }
h1 { font-size: 2rem; }  /* 32px, scales with user settings */
p { font-size: 1rem; }  /* 16px */

/* ❌ BAD: Fixed pixel sizes */
h1 { font-size: 32px; }  /* Won't scale */
```

**Testing:**
1. Browser: Settings → Font size → Increase to 200%
2. Check that all text is visible (no overflow, truncation)

---

### 3.4 Images of Text (1.4.5)

**Guideline:** Don't use images of text (use actual text instead)

```html
<!-- ❌ BAD: Logo as image with text -->
<img src="/logo-with-text.png" alt="Coinsphere">

<!-- ✅ GOOD: Logo as SVG + text -->
<div class="logo">
  <svg><!-- icon --></svg>
  <span>Coinsphere</span>
</div>
```

---

## 4. Operable

> "User interface components and navigation must be operable."

### 4.1 Keyboard Accessible (2.1)

**Guideline:** All functionality available via keyboard

**Focus management:**
```css
/* ✅ GOOD: Visible focus indicator */
button:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

/* ❌ BAD: Remove outline without replacement */
button:focus {
  outline: none;
}
```

**Tab order:**
```html
<!-- ✅ GOOD: Logical tab order (modal traps focus) -->
<div role="dialog" aria-modal="true">
  <button tabindex="0">Close</button>
  <input tabindex="0" />
  <button tabindex="0">Save</button>
</div>

<!-- ❌ BAD: Custom tabindex disrupts natural order -->
<button tabindex="5">Should be first</button>
<button tabindex="1">Actually first</button>
```

**Interactive elements:**
```html
<!-- ✅ GOOD: Use semantic elements -->
<button onclick="handleClick()">Add Holding</button>

<!-- ❌ BAD: div as button (not keyboard accessible) -->
<div onclick="handleClick()">Add Holding</div>

<!-- ⚠️ ACCEPTABLE: div with ARIA + keyboard handler -->
<div
  role="button"
  tabindex="0"
  onclick="handleClick()"
  onkeypress="e.key === 'Enter' && handleClick()"
>
  Add Holding
</div>
```

---

### 4.2 Skip Navigation (2.4.1)

**Guideline:** Provide a way to skip repetitive content

```html
<!-- ✅ GOOD: Skip link (hidden until focused) -->
<a href="#main-content" class="skip-link">
  Skip to main content
</a>

<style>
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: #000;
  color: #fff;
  padding: 8px;
  z-index: 100;
}

.skip-link:focus {
  top: 0;
}
</style>

<main id="main-content">
  <!-- Page content -->
</main>
```

---

### 4.3 Page Titled (2.4.2)

**Guideline:** Pages have descriptive titles

```html
<!-- ✅ GOOD: Specific, descriptive titles -->
<title>Portfolio Overview - Coinsphere</title>
<title>Bitcoin (BTC) Details - Coinsphere</title>
<title>Create Price Alert - Coinsphere</title>

<!-- ❌ BAD: Generic title -->
<title>Coinsphere</title>
```

**Dynamic title updates (React):**
```typescript
import { useEffect } from 'react';

function PortfolioPage() {
  useEffect(() => {
    document.title = 'Portfolio Overview - Coinsphere';
  }, []);

  return <div>{/* ... */}</div>;
}
```

---

### 4.4 Focus Order (2.4.3)

**Guideline:** Focus order follows visual/logical sequence

```html
<!-- ✅ GOOD: Tab order matches visual layout -->
<form>
  <input name="email" />  <!-- Tab 1 -->
  <input name="password" />  <!-- Tab 2 -->
  <button type="submit">Login</button>  <!-- Tab 3 -->
</form>

<!-- ❌ BAD: Confusing order -->
<div>
  <button tabindex="3">Submit</button>
  <input tabindex="1" name="email" />
  <input tabindex="2" name="password" />
</div>
```

---

### 4.5 Link Purpose (2.4.4)

**Guideline:** Link purpose clear from text alone

```html
<!-- ✅ GOOD: Descriptive link text -->
<a href="/docs/api">Read the API documentation</a>

<!-- ❌ BAD: Generic "click here" -->
<a href="/docs/api">Click here</a> to read the docs.

<!-- ✅ GOOD: Context provided via aria-label -->
<a href="/holdings/btc" aria-label="View Bitcoin holdings details">
  View details
</a>
```

---

### 4.6 Multiple Ways (2.4.5)

**Guideline:** Multiple ways to find pages (nav, search, sitemap)

**Implementation:**
- ✅ Main navigation menu (header)
- ✅ Search bar (global)
- ✅ Sitemap (/sitemap.xml)
- ✅ Breadcrumbs (on deep pages)

---

### 4.7 Headings and Labels (2.4.6)

**Guideline:** Headings and labels describe topic/purpose

```html
<!-- ✅ GOOD: Descriptive heading hierarchy -->
<h1>Portfolio Overview</h1>
<section>
  <h2>Holdings</h2>
  <h3>Bitcoin (BTC)</h3>
</section>

<!-- ❌ BAD: Skipping heading levels -->
<h1>Portfolio Overview</h1>
<h4>Holdings</h4>  <!-- Skipped h2, h3 -->
```

---

### 4.8 Focus Visible (2.4.7)

**Guideline:** Keyboard focus is visible

```css
/* ✅ GOOD: Custom focus ring */
*:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
  border-radius: 4px;
}
```

---

## 5. Understandable

> "Information and the operation of user interface must be understandable."

### 5.1 Language of Page (3.1.1)

**Guideline:** Declare page language

```html
<!-- ✅ GOOD: Language declared -->
<html lang="en">

<!-- ✅ GOOD: Mixed languages -->
<html lang="en">
  <body>
    <p>Welcome to Coinsphere</p>
    <p lang="es">Bienvenido a Coinsphere</p>
  </body>
</html>
```

---

### 5.2 On Focus (3.2.1)

**Guideline:** Focus doesn't trigger unexpected changes

```typescript
// ✅ GOOD: Modal opens on click, not focus
<button onClick={() => setShowModal(true)}>Open</button>

// ❌ BAD: Modal opens on focus (unexpected)
<button onFocus={() => setShowModal(true)}>Open</button>
```

---

### 5.3 On Input (3.2.2)

**Guideline:** Input doesn't trigger unexpected changes

```typescript
// ✅ GOOD: Submit button triggers action
<form onSubmit={handleSubmit}>
  <input name="email" />
  <button type="submit">Submit</button>
</form>

// ❌ BAD: Auto-submit on input blur (unexpected)
<input onBlur={() => form.submit()} />
```

---

### 5.4 Consistent Navigation (3.2.3)

**Guideline:** Navigation appears in same place on each page

```html
<!-- ✅ GOOD: Nav in same position across all pages -->
<header>
  <nav>
    <a href="/">Home</a>
    <a href="/portfolio">Portfolio</a>
    <a href="/alerts">Alerts</a>
  </nav>
</header>

<main>
  <!-- Page content varies -->
</main>

<footer>
  <!-- Footer in same position -->
</footer>
```

---

### 5.5 Error Identification (3.3.1)

**Guideline:** Errors identified clearly

```html
<!-- ✅ GOOD: Error message with aria-describedby -->
<label for="email">Email</label>
<input
  id="email"
  type="email"
  aria-invalid="true"
  aria-describedby="email-error"
/>
<span id="email-error" role="alert">
  Please enter a valid email address
</span>

<!-- ❌ BAD: Error not programmatically associated -->
<input type="email" />
<span style="color: red;">Invalid email</span>
```

---

### 5.6 Labels or Instructions (3.3.2)

**Guideline:** Labels provided for inputs

```html
<!-- ✅ GOOD: Explicit label -->
<label for="quantity">Quantity (BTC)</label>
<input id="quantity" type="number" step="0.00000001" />

<!-- ✅ GOOD: aria-label for icon-only input -->
<button aria-label="Search">
  <svg><!-- search icon --></svg>
</button>

<!-- ❌ BAD: No label -->
<input type="text" placeholder="Search..." />
```

---

### 5.7 Error Suggestion (3.3.3)

**Guideline:** Suggest how to fix errors

```html
<!-- ✅ GOOD: Helpful error message -->
<span role="alert">
  Password must be at least 8 characters with 1 uppercase letter and 1 number
</span>

<!-- ❌ BAD: Vague error -->
<span role="alert">Invalid password</span>
```

---

## 6. Robust

> "Content must be robust enough to be interpreted by assistive technologies."

### 6.1 Parsing (4.1.1)

**Guideline:** No duplicate IDs, proper nesting

```html
<!-- ✅ GOOD: Valid HTML -->
<div id="unique-1">
  <p>Content</p>
</div>

<!-- ❌ BAD: Duplicate ID -->
<div id="duplicate">First</div>
<div id="duplicate">Second</div>
```

**Validation:**
```bash
# Use W3C HTML Validator
# https://validator.w3.org/
```

---

### 6.2 Name, Role, Value (4.1.2)

**Guideline:** UI components have accessible names/roles

```html
<!-- ✅ GOOD: Semantic button -->
<button>Add Holding</button>

<!-- ✅ GOOD: Custom component with ARIA -->
<div
  role="button"
  aria-pressed="false"
  tabindex="0"
  onkeypress="handleKeyPress"
>
  Toggle
</div>

<!-- ❌ BAD: div without role -->
<div onclick="handleClick()">Add Holding</div>
```

---

### 6.3 Status Messages (4.1.3)

**Guideline:** Status messages announced to screen readers

```html
<!-- ✅ GOOD: Live region for success message -->
<div role="status" aria-live="polite">
  Holding added successfully!
</div>

<!-- ✅ GOOD: Alert for errors -->
<div role="alert" aria-live="assertive">
  Failed to save. Please try again.
</div>
```

**React implementation:**
```typescript
function AddHoldingForm() {
  const [message, setMessage] = useState('');

  const handleSubmit = async () => {
    try {
      await addHolding();
      setMessage('Holding added successfully!');
    } catch (error) {
      setMessage('Failed to save. Please try again.');
    }
  };

  return (
    <form>
      {/* Form fields */}
      <button type="submit">Add</button>
      {message && (
        <div role={message.includes('Failed') ? 'alert' : 'status'}>
          {message}
        </div>
      )}
    </form>
  );
}
```

---

## 7. Testing & Validation

### 7.1 Automated Testing

**Tools:**

**1. Lighthouse (Chrome DevTools):**
```bash
# Run Lighthouse audit
1. Open Chrome DevTools (F12)
2. Navigate to "Lighthouse" tab
3. Select "Accessibility" category
4. Click "Generate report"

# Target score: 90+ (out of 100)
```

**2. axe DevTools (Browser Extension):**
```bash
# Install: https://www.deque.com/axe/devtools/
1. Install browser extension
2. Open DevTools → axe DevTools tab
3. Click "Scan ALL of my page"
4. Fix all Critical and Serious issues
```

**3. Jest + jest-axe (Unit Tests):**
```typescript
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

test('Dashboard has no accessibility violations', async () => {
  const { container } = render(<Dashboard />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

---

### 7.2 Manual Testing

**Screen reader testing:**

**NVDA (Windows - free):**
```bash
1. Download NVDA: https://www.nvaccess.org/
2. Install and launch
3. Navigate website with keyboard only
4. Verify all content is announced
5. Test forms, modals, alerts
```

**VoiceOver (macOS - built-in):**
```bash
1. Enable: Cmd+F5
2. Navigate: VO+Arrow keys
3. Interact: VO+Space
4. Test all interactive elements
```

**JAWS (Windows - paid, most popular):**
- Used by 40% of screen reader users
- Most comprehensive testing

---

### 7.3 Keyboard Testing

**Test checklist:**

- [ ] **Tab navigation:** Can reach all interactive elements
- [ ] **Focus visible:** Clear visual indicator on focused element
- [ ] **Enter/Space:** Activates buttons/links
- [ ] **Escape:** Closes modals/dropdowns
- [ ] **Arrow keys:** Navigate within menus/lists
- [ ] **Tab trap:** Focus trapped in modals (can't tab to background)

**Example modal test:**
```
1. Open modal with keyboard (Enter on trigger button)
2. Tab through modal elements (stays within modal)
3. Escape closes modal (focus returns to trigger)
4. Tab doesn't reach background content while modal open
```

---

### 7.4 Color Contrast Testing

**Tools:**
- **WebAIM Contrast Checker:** https://webaim.org/resources/contrastchecker/
- **Chrome DevTools:** Inspect element → Contrast ratio shown in color picker

**Automated check:**
```typescript
// axe-core checks contrast automatically
const results = await axe(container);
// Returns violations if contrast < 4.5:1
```

---

## 8. Common Patterns

### 8.1 Accessible Modal Dialog

```typescript
import { useEffect, useRef } from 'react';

function Modal({ isOpen, onClose, children }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Store previously focused element
      previousFocus.current = document.activeElement as HTMLElement;

      // Focus first element in modal
      modalRef.current?.querySelector('button')?.focus();

      // Trap focus
      const handleTabKey = (e: KeyboardEvent) => {
        if (e.key !== 'Tab') return;

        const focusableElements = modalRef.current?.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements?.[0] as HTMLElement;
        const lastElement = focusableElements?.[focusableElements.length - 1] as HTMLElement;

        if (e.shiftKey && document.activeElement === firstElement) {
          lastElement?.focus();
          e.preventDefault();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          firstElement?.focus();
          e.preventDefault();
        }
      };

      document.addEventListener('keydown', handleTabKey);
      return () => document.removeEventListener('keydown', handleTabKey);
    } else {
      // Restore focus when modal closes
      previousFocus.current?.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="modal-overlay"
      onClick={onClose}
    >
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h2 id="modal-title">Modal Title</h2>
        {children}
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
```

---

### 8.2 Accessible Form Validation

```typescript
function SignupForm() {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!isValidEmail(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      // Announce errors to screen reader
      const errorMessage = Object.values(newErrors).join('. ');
      announceToScreenReader(errorMessage);
      return;
    }

    await signup(email, password);
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          aria-invalid={errors.email ? 'true' : 'false'}
          aria-describedby={errors.email ? 'email-error' : undefined}
        />
        {errors.email && (
          <span id="email-error" role="alert" className="error">
            {errors.email}
          </span>
        )}
      </div>

      <div>
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          aria-invalid={errors.password ? 'true' : 'false'}
          aria-describedby={errors.password ? 'password-error' : undefined}
        />
        {errors.password && (
          <span id="password-error" role="alert" className="error">
            {errors.password}
          </span>
        )}
      </div>

      <button type="submit">Sign Up</button>
    </form>
  );
}

// Screen reader announcement helper
function announceToScreenReader(message: string) {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'alert');
  announcement.setAttribute('aria-live', 'assertive');
  announcement.className = 'sr-only';
  announcement.textContent = message;

  document.body.appendChild(announcement);

  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}
```

---

### 8.3 Accessible Data Table

```typescript
function HoldingsTable({ holdings }: { holdings: Holding[] }) {
  return (
    <table>
      <caption className="sr-only">Your crypto holdings</caption>
      <thead>
        <tr>
          <th scope="col">Asset</th>
          <th scope="col">Quantity</th>
          <th scope="col">Value (USD)</th>
          <th scope="col">24h Change</th>
          <th scope="col">Risk Score</th>
          <th scope="col">Actions</th>
        </tr>
      </thead>
      <tbody>
        {holdings.map((holding) => (
          <tr key={holding.id}>
            <th scope="row">{holding.assetSymbol}</th>
            <td>{holding.quantity}</td>
            <td>{formatCurrency(holding.currentValue)}</td>
            <td>
              <span
                className={holding.change24h > 0 ? 'text-green' : 'text-red'}
                aria-label={`${holding.change24h > 0 ? 'up' : 'down'} ${Math.abs(holding.change24h)}%`}
              >
                {holding.change24h > 0 ? '↑' : '↓'} {Math.abs(holding.change24h)}%
              </span>
            </td>
            <td>{holding.riskScore}</td>
            <td>
              <button aria-label={`Edit ${holding.assetSymbol} holding`}>
                Edit
              </button>
              <button aria-label={`Delete ${holding.assetSymbol} holding`}>
                Delete
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

---

### 8.4 Screen Reader Only Utility Class

```css
/* Hide visually but keep for screen readers */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

/* Make visible when focused (for skip links) */
.sr-only-focusable:focus {
  position: static;
  width: auto;
  height: auto;
  overflow: visible;
  clip: auto;
  white-space: normal;
}
```

---

## Appendix: Accessibility Checklist

**Before launch:**

**Perceivable:**
- [ ] All images have alt text
- [ ] Color contrast meets AA standards (4.5:1)
- [ ] Text can be resized to 200%
- [ ] No images of text

**Operable:**
- [ ] All features keyboard accessible
- [ ] Skip navigation link present
- [ ] Page titles descriptive
- [ ] Focus order logical
- [ ] Link text descriptive
- [ ] Focus indicators visible

**Understandable:**
- [ ] Language declared (lang="en")
- [ ] No unexpected focus changes
- [ ] Consistent navigation
- [ ] Form errors identified
- [ ] Labels provided for all inputs

**Robust:**
- [ ] Valid HTML (no duplicate IDs)
- [ ] ARIA roles/labels correct
- [ ] Status messages announced

**Testing:**
- [ ] Lighthouse accessibility score 90+
- [ ] axe DevTools shows no critical issues
- [ ] Keyboard-only navigation works
- [ ] Screen reader testing (NVDA/VoiceOver)

---

**Document End**

*Accessibility will be validated during Sprint 1 QA and continuously monitored post-launch.*
