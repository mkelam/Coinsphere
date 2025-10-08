# Coinsphere Design System

## 🎨 **CRITICAL: Design Consistency Rule**

**ALL new pages, features, and components MUST maintain the look and feel defined in:**
```
C:\Users\Mac\OneDrive\Desktop\Projects\crypo scanner\frontend\cryptosense-base
```

This directory contains the **canonical design system** that must be followed throughout the application.

---

## 🖤 **Core Design Philosophy**

### Black Glass Morphism Theme
- **Primary Background**: Pure black (#000000)
- **Circuit Board Background**: Fixed background image for tech aesthetic
- **Glass Effect**: Frosted glass cards with backdrop blur
- **Accent Colors**: Blue (#3b82f6), Green (#10b981), Red (#ef4444)

---

## 🎯 **Design Tokens**

### Background Colors
```css
--bg-primary: #000000;           /* Pure black background */
--bg-secondary: #0a0a0a;          /* Slightly lighter black */
--bg-glass: rgba(255, 255, 255, 0.03);  /* Subtle glass effect */
--bg-glass-hover: rgba(255, 255, 255, 0.06);  /* Hover state */
```

### Text Colors
```css
--text-primary: #ffffff;          /* Primary text - white */
--text-secondary: rgba(255, 255, 255, 0.7);  /* Secondary text */
--text-tertiary: rgba(255, 255, 255, 0.5);   /* Tertiary text */
```

### Accent Colors
```css
--accent-blue: #3b82f6;   /* Primary accent - blue */
--accent-green: #10b981;  /* Positive/success - green */
--accent-red: #ef4444;    /* Negative/danger - red */
```

### Borders
```css
--border-glass: rgba(255, 255, 255, 0.08);  /* Glass card borders */
--border-glass-hover: rgba(255, 255, 255, 0.12);  /* Hover borders */
```

### Shadows
```css
--shadow-glass: 0 8px 32px rgba(0, 0, 0, 0.5);
--shadow-glass-hover: 0 12px 48px rgba(0, 0, 0, 0.6);
```

### Border Radius
```css
--radius: 0.75rem;  /* 12px - standard radius for cards */
```

---

## 💎 **Glass Card Component**

### Standard Glass Card
```tsx
import { GlassCard } from "@/components/glass-card"

<GlassCard>
  Your content here
</GlassCard>
```

### Glass Card CSS Class
```css
.glass-card {
  background: rgba(255, 255, 255, 0.15);  /* 15% white opacity */
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: var(--radius);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.7);
  transition: all 0.2s ease;
}

.glass-card:hover {
  background: rgba(255, 255, 255, 0.23);  /* 23% on hover */
  border-color: rgba(255, 255, 255, 0.2);
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.8);
  transform: translateY(-2px);  /* Subtle lift effect */
}
```

---

## 🎨 **Component Guidelines**

### 1. Cards & Containers
- **ALWAYS** use glass morphism effect for cards
- Use `GlassCard` component or `.glass-card` class
- Include hover effects (subtle lift + enhanced glow)
- Maintain consistent padding (p-6 default)

**Example:**
```tsx
<GlassCard className="p-6">
  <h2 className="text-xl font-semibold mb-4">Card Title</h2>
  <p className="text-secondary">Card content</p>
</GlassCard>
```

### 2. Typography
- **Headings**: Use white (#ffffff) for primary headings
- **Body Text**: Use `text-secondary` for secondary content
- **Muted Text**: Use `text-tertiary` for less important info
- **Font Sizes**: Follow Tailwind's semantic scale

**Example:**
```tsx
<h1 className="text-3xl font-bold text-primary">Main Heading</h1>
<p className="text-secondary">Body text with 70% opacity</p>
<span className="text-tertiary text-sm">Muted helper text</span>
```

### 3. Buttons
- Primary: Blue gradient or solid blue
- Destructive: Red for dangerous actions
- Secondary: Glass effect with border
- Ghost: Transparent with hover effect

**Example:**
```tsx
import { Button } from "@/components/ui/button"

<Button variant="default">Primary Action</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Secondary</Button>
<Button variant="ghost">Ghost Button</Button>
```

### 4. Color Coding
- **Green (#10b981)**: Positive values, gains, buy actions
- **Red (#ef4444)**: Negative values, losses, sell actions
- **Blue (#3b82f6)**: Primary actions, links, info
- **Orange**: Warnings, transfers

**Example:**
```tsx
<span className={value > 0 ? "text-green-500" : "text-red-500"}>
  {value > 0 ? '+' : ''}{value.toFixed(2)}%
</span>
```

### 5. Badges
- Use color-coded badges for transaction types
- Maintain consistent size and padding
- Use uppercase text for labels

**Example:**
```tsx
import { Badge } from "@/components/ui/badge"

<Badge className="bg-green-500">BUY</Badge>
<Badge className="bg-red-500">SELL</Badge>
<Badge className="bg-blue-500">TRANSFER IN</Badge>
```

### 6. Tables
- Glass background for table containers
- Subtle borders between rows
- Hover effects on rows
- Right-align numbers, left-align text

### 7. Charts
- Use consistent color palette (chart-1 through chart-5)
- Dark background for chart containers
- White/light gray text for labels
- Grid lines at 10% opacity

---

## 🌐 **Background**

### Circuit Board Background
```css
body {
  background-color: #000000;
  background-image: url("https://hebbkx1anhila5yf.public.blob.vercel-storage.com/circuit-board-bg-WOSYoS9jcKT3zqRi6sAJIWtMFLgrMG.png");
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
  background-repeat: no-repeat;
  color: white;
}
```

**IMPORTANT**: This background must be present on ALL pages.

---

## 📐 **Layout Standards**

### Page Container
```tsx
<main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
  {/* Page content */}
</main>
```

### Grid Layouts
```tsx
{/* Two columns on large screens */}
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
  <GlassCard>Column 1</GlassCard>
  <GlassCard>Column 2</GlassCard>
</div>
```

### Spacing
- Section spacing: `mb-6` (24px)
- Card padding: `p-6` (24px)
- Grid gap: `gap-6` (24px)
- Component gap: `gap-4` (16px)

---

## ✨ **Interactive States**

### Hover Effects
- Cards: Lift slightly (`translateY(-2px)`) + enhance glow
- Buttons: Brighten background
- Links: Increase opacity or color intensity

### Transitions
- All interactive elements: `transition: all 0.2s ease`
- Smooth, consistent animations

### Focus States
- Outline: Use `outline-ring/50` from Tailwind
- Visible keyboard focus indicators

---

## 🎭 **Shadcn/ui Components**

### Available Components (from cryptosense-base)
All Shadcn/ui components are already configured with the black glass theme:

- Accordion
- Alert Dialog
- Alert
- Avatar
- Badge
- Button
- Calendar
- Card
- Carousel
- Chart
- Checkbox
- Dialog
- Dropdown Menu
- Form
- Input
- Select
- Separator
- Sheet
- Skeleton
- Slider
- Switch
- Table
- Tabs
- Textarea
- Toast
- Tooltip
- And more...

**Import from**: `@/components/ui/[component-name]`

---

## 🚨 **DON'T DO THIS**

❌ Don't use solid white backgrounds
❌ Don't use colors outside the defined palette
❌ Don't remove the circuit board background
❌ Don't use different glass effect values
❌ Don't use different border radius values
❌ Don't create custom components that don't match the design system

---

## ✅ **ALWAYS DO THIS**

✅ Use GlassCard for all card containers
✅ Use the defined color palette
✅ Maintain the circuit board background
✅ Use consistent spacing (gap-4, gap-6, p-6)
✅ Use consistent border radius (rounded-lg, rounded-xl)
✅ Include hover effects on interactive elements
✅ Use color coding for financial data (green = up, red = down)
✅ Test on black background to ensure readability

---

## 📦 **Component Checklist**

When creating a new component, ensure:

- [ ] Uses GlassCard or .glass-card class for containers
- [ ] Colors are from the defined palette
- [ ] Text is readable on black background
- [ ] Hover effects are implemented
- [ ] Spacing follows the standard (gap-4, gap-6, p-6)
- [ ] Border radius is consistent (--radius)
- [ ] Typography hierarchy is maintained
- [ ] Responsive breakpoints are used (sm:, md:, lg:, xl:)
- [ ] Shadcn/ui components are used where applicable
- [ ] Component renders correctly on circuit board background

---

## 🎨 **Reference Components**

### Portfolio Hero
Location: `frontend/cryptosense-base/components/portfolio-hero.tsx`
- Large glass card
- Portfolio value display
- 24h change with color coding
- Quick stats

### Holdings Table
Location: `frontend/cryptosense-base/components/holdings-table.tsx`
- Glass card table
- Token logos
- Color-coded price changes
- Right-aligned numbers

### Asset Allocation
Location: `frontend/cryptosense-base/components/asset-allocation.tsx`
- Glass card with chart
- Colored chart segments
- Legend with percentages

### Recent Transactions
Location: `frontend/cryptosense-base/components/recent-transactions.tsx`
- List of transactions
- Type badges with colors
- Transaction details

---

## 🔗 **Resources**

- **Base Design Files**: `frontend/cryptosense-base/`
- **Global Styles**: `frontend/cryptosense-base/app/globals.css`
- **Shadcn/ui Config**: `frontend/cryptosense-base/components.json`
- **Utils**: `frontend/cryptosense-base/lib/utils.ts`

---

## 📝 **Notes**

1. **This design system is mandatory** for all new features and pages
2. **Consistency is critical** - users expect the same look across all pages
3. **When in doubt**, reference existing components in `cryptosense-base/`
4. **Glass morphism** is the core design language - maintain it everywhere
5. **Black background** creates the premium, modern aesthetic
6. **Circuit board background** reinforces the crypto/tech theme

---

**Remember: The cryptosense-base directory is the source of truth for design. When adding new features, always match this aesthetic!**
