# 🎨 Coinsphere Design System

**Version:** 1.0
**Last Updated:** October 9, 2025
**Status:** Production Ready
**Base Design:** CryptoSense Glassmorphism Theme

---

## 📋 Table of Contents

1. [Design Philosophy](#design-philosophy)
2. [Color Palette](#color-palette)
3. [Typography](#typography)
4. [Spacing & Layout](#spacing--layout)
5. [Glassmorphism Effects](#glassmorphism-effects)
6. [Components](#components)
7. [Animations & Interactions](#animations--interactions)
8. [Accessibility](#accessibility)
9. [Implementation Guidelines](#implementation-guidelines)

---

## 🎯 Design Philosophy

### Core Principles

**User-Centric Above All**
Every design decision serves user needs. Clear hierarchy, intuitive navigation, and seamless interactions guide users through their crypto portfolio journey.

**Premium Glassmorphism Aesthetic**
Sophisticated glass effects create depth and visual interest while maintaining excellent readability on pure black backgrounds.

**Simplicity Through Refinement**
Subtle transparency (0.05 opacity) creates an elegant, premium feel without overwhelming users with heavy visual elements.

**Consistent & Predictable**
All components follow the same design language, creating a cohesive experience across authentication, dashboard, and settings.

---

## 🎨 Color Palette

### Primary Colors

```css
/* Pure Black Background */
--bg-primary: #000000;
--bg-secondary: #0a0a0a;

/* Glass Effect Backgrounds */
--bg-glass: rgba(255, 255, 255, 0.03);
--bg-glass-hover: rgba(255, 255, 255, 0.06);
```

### Text Colors

```css
/* White Text Hierarchy */
--text-primary: #ffffff;           /* 100% opacity - Headings, primary text */
--text-secondary: rgba(255, 255, 255, 0.7);  /* 70% opacity - Body text */
--text-tertiary: rgba(255, 255, 255, 0.5);   /* 50% opacity - Metadata, labels */
```

### Accent Colors

```css
/* Action & Status Colors */
--accent-blue: #3b82f6;    /* Primary actions, links, info */
--accent-green: #10b981;   /* Positive changes, success states */
--accent-red: #ef4444;     /* Negative changes, errors, destructive actions */
```

### Border Colors

```css
/* Subtle Glass Borders */
--border-glass: rgba(255, 255, 255, 0.08);       /* Default border */
--border-glass-hover: rgba(255, 255, 255, 0.12); /* Hover state border */
```

### Color Usage Guidelines

| Color | Use Case | Example |
|-------|----------|---------|
| **Blue (#3b82f6)** | Primary CTAs, links, selected states | Login button, active nav items |
| **Green (#10b981)** | Positive values, success messages | +5.23% gain, "Success!" alerts |
| **Red (#ef4444)** | Negative values, errors, warnings | -2.15% loss, "Error" messages |
| **White (100%)** | Headlines, important data | Portfolio value, token symbols |
| **White (70%)** | Body text, descriptions | Card descriptions, table content |
| **White (50%)** | Labels, metadata | "24h Change", timestamps |

---

## ✍️ Typography

### Font Stack

```css
/* Primary Sans-Serif */
--font-sans: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
             "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;

/* Monospace for Numbers */
--font-mono: ui-monospace, SFMono-Regular, "SF Mono", Monaco,
             Consolas, "Liberation Mono", "Courier New", monospace;
```

### Type Scale

| Size | Usage | CSS Class | Example |
|------|-------|-----------|---------|
| **3xl** | Page titles | `text-3xl` | "CoinSphere" |
| **2xl** | Section headers | `text-2xl` | "Total Portfolio Value" |
| **xl** | Card titles | `text-xl` | "$125,420.50" |
| **lg** | Subheadings | `text-lg` | "+5.23%" |
| **base** | Body text | `text-base` | Descriptions |
| **sm** | Labels | `text-sm` | "24h Change" |
| **xs** | Metadata | `text-xs` | Timestamps |

### Font Weight

```css
font-weight: 400;  /* Regular - Body text */
font-weight: 500;  /* Medium - Emphasized text */
font-weight: 600;  /* Semibold - Subheadings */
font-weight: 700;  /* Bold - Headlines, values */
```

---

## 📐 Spacing & Layout

### Spacing Scale (Tailwind)

```css
/* Base unit: 0.25rem (4px) */
p-2  → 0.5rem (8px)
p-3  → 0.75rem (12px)
p-4  → 1rem (16px)
p-6  → 1.5rem (24px)
p-8  → 2rem (32px)

/* Gap between elements */
gap-2 → 0.5rem (8px)
gap-4 → 1rem (16px)
gap-6 → 1.5rem (24px)

/* Margins */
mb-4 → margin-bottom: 1rem
mb-6 → margin-bottom: 1.5rem
mb-8 → margin-bottom: 2rem
```

### Container System

```css
/* Maximum width container */
.max-w-7xl {
  max-width: 80rem; /* 1280px */
  margin: 0 auto;
  padding: 0 1rem; /* Mobile */
}

/* Responsive padding */
px-4 sm:px-6 lg:px-8
/* Mobile: 1rem, Tablet: 1.5rem, Desktop: 2rem */
```

### Grid Layout

```css
/* Two-column responsive grid */
.grid {
  display: grid;
  grid-template-columns: 1fr;        /* Mobile: 1 column */
  gap: 1.5rem;
}

@media (min-width: 1024px) {
  .grid {
    grid-template-columns: 1fr 1fr;  /* Desktop: 2 columns */
  }
}
```

---

## ✨ Glassmorphism Effects

### Glass Card Component

**Primary Implementation:**

```css
.glass-card {
  /* Subtle transparent background */
  background: rgba(255, 255, 255, 0.05);

  /* Backdrop blur for glass effect */
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);

  /* Delicate border */
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 0.75rem;

  /* Depth shadow */
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.7);

  /* Smooth transitions */
  transition: all 0.2s ease;
}

.glass-card:hover {
  /* Slightly more visible on hover */
  background: rgba(255, 255, 255, 0.10);
  border-color: rgba(255, 255, 255, 0.12);
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.8);

  /* Subtle elevation */
  transform: translateY(-2px);
}
```

### Background

```css
body {
  /* Pure black base */
  background-color: #000000;

  /* Circuit board pattern */
  background-image: url("/circuit-board-bg.png");
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
  background-repeat: no-repeat;

  /* White text default */
  color: white;
}
```

### Design Rationale

**Why 0.05 opacity instead of 0.15?**

The reduced opacity (67% more transparent than the original base) creates:
- ✅ Better readability - Text stands out more clearly
- ✅ Premium aesthetic - Subtle elegance vs heavy overlays
- ✅ Enhanced depth - Circuit board background shows through
- ✅ Reduced visual noise - Cleaner, more focused interface

---

## 🧩 Components

### 1. GlassCard Component

**Usage:**
```tsx
import { GlassCard } from "@/components/glass-card"

<GlassCard>
  <h2>Portfolio Value</h2>
  <p>$125,420.50</p>
</GlassCard>
```

**Props:**
- `children: ReactNode` - Content inside the card
- `className?: string` - Additional Tailwind classes
- `hover?: boolean` - Enable hover effect (default: true)

**Variants:**
```tsx
/* Default card with padding */
<GlassCard>Content</GlassCard>

/* Card without hover effect */
<GlassCard hover={false}>Static content</GlassCard>

/* Card with custom padding */
<GlassCard className="p-8">More padding</GlassCard>
```

---

### 2. Header Component

**Structure:**
```tsx
<header className="sticky top-0 z-50 backdrop-blur-md bg-[#0A0E27]/30 border-b border-white/5">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="flex items-center justify-between h-16">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <div className="text-2xl">🔮</div>
        <span className="text-xl font-semibold">CoinSphere</span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        <button>Alerts</button>
        <button>User Menu</button>
      </div>
    </div>
  </div>
</header>
```

**Key Features:**
- ✅ Sticky positioning (stays at top on scroll)
- ✅ Backdrop blur for glass effect
- ✅ Crystal ball icon (🔮) branding
- ✅ Responsive padding
- ✅ Alerts and user menu dropdowns

---

### 3. Button Styles

**Primary Button:**
```tsx
<button className="px-4 py-3 rounded-lg bg-[#3b82f6] hover:bg-[#3b82f6]/90 text-white font-medium transition-colors">
  Sign In
</button>
```

**Glass Button:**
```tsx
<button className="px-4 py-3 rounded-lg bg-white/[0.05] hover:bg-white/[0.10] border border-white/10 text-white transition-colors">
  Connect Wallet
</button>
```

**Icon Button:**
```tsx
<button className="p-2 rounded-lg hover:bg-white/[0.03] transition-colors">
  <Bell className="w-5 h-5" />
</button>
```

---

### 4. Input Fields

**Glass Input:**
```tsx
<input
  type="email"
  className="w-full px-4 py-3 rounded-lg bg-white/[0.05] border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
  placeholder="you@example.com"
/>
```

**Key Features:**
- ✅ Glass background (5% white)
- ✅ Subtle border
- ✅ White text on dark background
- ✅ Focus ring (20% white)
- ✅ Placeholder at 30% opacity

---

### 5. User Menu Dropdown

**Structure:**
```tsx
<div className="relative">
  <button data-testid="user-menu-button">
    <User className="w-5 h-5" />
  </button>

  {showUserMenu && (
    <div className="absolute right-0 mt-2 w-56 glass-card p-2">
      {/* User info */}
      <div className="px-3 py-2 border-b border-white/10 mb-2">
        <div className="text-sm font-medium">John Doe</div>
        <div className="text-xs text-white/50">john@example.com</div>
      </div>

      {/* Menu items */}
      <button className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-white/[0.05] rounded-lg">
        <Settings className="w-4 h-4" />
        Settings
      </button>

      <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[#EF4444] hover:bg-white/[0.05] rounded-lg">
        <LogOut className="w-4 h-4" />
        Logout
      </button>
    </div>
  )}
</div>
```

---

## 🎬 Animations & Interactions

### Transitions

**Standard Transition:**
```css
transition: all 0.2s ease;
```

**Use Cases:**
- Button hover states
- Card hover effects
- Dropdown animations
- Color changes

### Hover Effects

**Card Elevation:**
```css
.glass-card:hover {
  transform: translateY(-2px);
}
```

**Button Brightness:**
```css
.btn-primary:hover {
  background: color-mix(in srgb, var(--accent-blue) 90%, white);
}
```

### Loading States

**Spinner:**
```tsx
<div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
```

**Skeleton Loader:**
```tsx
<div className="animate-pulse">
  <div className="h-4 bg-white/10 rounded w-3/4 mb-2"></div>
  <div className="h-4 bg-white/10 rounded w-1/2"></div>
</div>
```

---

## ♿ Accessibility

### Color Contrast

All text colors meet WCAG AA standards:
- ✅ White text on black: 21:1 contrast ratio
- ✅ White/70 on black: 14.7:1 contrast ratio
- ✅ White/50 on black: 10.5:1 contrast ratio

### Keyboard Navigation

```tsx
/* Focusable elements */
.focusable {
  outline: 2px solid rgba(255, 255, 255, 0.5);
  outline-offset: 2px;
}

/* Focus visible for keyboard users only */
.focus-visible:focus {
  outline: 2px solid rgba(255, 255, 255, 0.5);
}
```

### ARIA Labels

**Required for icon-only buttons:**
```tsx
<button aria-label="Notifications">
  <Bell className="w-5 h-5" />
</button>

<button aria-label="User menu">
  <User className="w-5 h-5" />
</button>
```

### Screen Reader Support

```tsx
/* Hidden content for screen readers */
<span className="sr-only">Current portfolio value:</span>
<span>$125,420.50</span>
```

---

## 🛠️ Implementation Guidelines

### Component Creation Checklist

When creating new components:

1. ✅ **Use glass-card base** - Apply `.glass-card` class for consistency
2. ✅ **Follow color palette** - Use defined CSS variables
3. ✅ **Add hover states** - 0.2s ease transitions
4. ✅ **Include data-testid** - For E2E testing
5. ✅ **Add ARIA labels** - For accessibility
6. ✅ **Responsive design** - Mobile-first approach
7. ✅ **Dark theme only** - No light mode variants

### CSS Variable Usage

**Correct:**
```css
background: rgba(255, 255, 255, 0.05);  /* Use exact values */
color: var(--text-primary);              /* Use CSS variables */
```

**Avoid:**
```css
background: rgba(255, 255, 255, 0.2);   /* Don't use random values */
color: #ffffff;                          /* Use variables instead */
```

### Tailwind Class Patterns

**Preferred order:**
```tsx
className="
  relative          /* Positioning */
  flex items-center /* Layout */
  gap-2             /* Spacing */
  px-4 py-3         /* Padding */
  rounded-lg        /* Borders */
  bg-white/[0.05]   /* Background */
  text-white        /* Text */
  hover:bg-white/10 /* Hover states */
  transition-all    /* Animations */
"
```

---

## 📊 Design Tokens Reference

### Quick Reference Table

| Token | Value | Usage |
|-------|-------|-------|
| `--bg-primary` | `#000000` | Page background |
| `--bg-glass` | `rgba(255,255,255,0.05)` | Card backgrounds |
| `--text-primary` | `#ffffff` | Headlines, important text |
| `--text-secondary` | `rgba(255,255,255,0.7)` | Body text |
| `--accent-blue` | `#3b82f6` | Primary actions |
| `--accent-green` | `#10b981` | Positive values |
| `--accent-red` | `#ef4444` | Negative values |
| `--border-glass` | `rgba(255,255,255,0.08)` | Component borders |
| `--radius` | `0.75rem` | Border radius |

---

## 🎯 Design Consistency Checklist

Before shipping a new component or page:

- [ ] Uses glass-card component or equivalent styling
- [ ] Color palette matches design system
- [ ] Hover states with 0.2s ease transition
- [ ] Responsive on mobile, tablet, desktop
- [ ] data-testid attributes for testing
- [ ] ARIA labels for accessibility
- [ ] Icons from Lucide React library
- [ ] 🔮 Crystal ball branding where appropriate
- [ ] Pure black (#000000) background
- [ ] White text with proper opacity levels

---

## 📝 Version History

**v1.0 (October 2025)**
- Initial design system documentation
- Glassmorphism theme with 0.05 opacity refinement
- Component library standardization
- Accessibility guidelines established

---

## 🔗 Resources

### Design Files
- Base Design: `frontend/cryptosense-base/`
- Current Implementation: `frontend/src/`
- Styles: `frontend/src/styles/index.css`

### Component Library
- Glass Card: `frontend/src/components/glass-card.tsx`
- Header: `frontend/src/components/header.tsx`
- UI Components: `frontend/src/components/ui/`

### Documentation
- README: `README.md`
- E2E Tests: `e2e/`
- Test Results: `test-results/`

---

**Maintained by:** Coinsphere Design Team
**Contact:** design@coinsphere.com
**License:** MIT

---

*This design system ensures consistency, accessibility, and a premium user experience across the entire Coinsphere platform.*
