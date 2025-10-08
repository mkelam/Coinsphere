# Figma Setup Guide - Coinsphere

**Document Version**: 1.0
**Date**: October 6, 2025
**Related Document**: [front-end-spec.md](front-end-spec.md)

---

## Overview

This guide provides step-by-step instructions for creating the Coinsphere design system in Figma, including design tokens, component library, and screen mockups.

**Estimated Time:** 8-12 hours for complete setup

---

## 1. Initial Figma Setup

### 1.1 Create New Figma File

1. Go to [figma.com](https://figma.com)
2. Click **"New Design File"**
3. Rename file to: **"Coinsphere Design System"**
4. Set up team sharing if working with multiple designers

### 1.2 File Structure (Pages)

Create the following pages in your Figma file:

```
📄 Pages:
├── 🎨 Design Tokens
├── 🧩 Components Library
├── 📱 Mobile Screens
├── 💻 Desktop Screens
├── 🎭 User Flows
└── 📋 Documentation
```

**To create pages:**
- Click the page dropdown (top left)
- Click **"+"** to add new page
- Rename each page accordingly

---

## 2. Design Tokens Setup

### 2.1 Color Styles

Navigate to **Design Tokens** page and create color swatches:

**Step-by-step:**

1. Draw a rectangle (R key)
2. Set dimensions to 200x100px
3. Fill with color from specification
4. Right-click fill color → **"Create Style"**
5. Name it according to convention below

**Color Styles to Create:**

| Style Name | Hex Code | Notes |
|------------|----------|-------|
| `Primary/Base` | #3B82F6 | Main brand color |
| `Primary/Dark` | #2563EB | Hover states |
| `Secondary/Base` | #8B5CF6 | Secondary actions |
| `Accent/Base` | #10B981 | Success states |
| `Success` | #22C55E | Low risk, confirmations |
| `Warning` | #F59E0B | Medium risk, cautions |
| `Error` | #EF4444 | High risk, errors |
| `Neutral/50` | #F9FAFB | Light backgrounds |
| `Neutral/100` | #F3F4F6 | Subtle backgrounds |
| `Neutral/500` | #6B7280 | Secondary text |
| `Neutral/900` | #111827 | Primary text |
| `Dark/Background` | #0F172A | Dark mode background |
| `Dark/Surface` | #1E293B | Dark mode cards |

**Pro Tip:** Use forward slashes (/) for hierarchical organization in color styles panel.

---

### 2.2 Typography Styles

**Step 1: Install Fonts**

Download and install these Google Fonts:
- [Inter](https://fonts.google.com/specimen/Inter) - Weights: 400, 600, 700
- [Manrope](https://fonts.google.com/specimen/Manrope) - Weights: 400, 600, 700
- [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono) - Weight: 400

**Step 2: Create Text Styles**

Create text boxes and apply these styles:

| Style Name | Font | Size | Weight | Line Height | Letter Spacing |
|------------|------|------|--------|-------------|----------------|
| `Heading/H1` | Manrope | 36px | Bold (700) | 43px (1.2) | -0.5px |
| `Heading/H2` | Manrope | 28px | SemiBold (600) | 36px (1.3) | -0.3px |
| `Heading/H3` | Manrope | 22px | SemiBold (600) | 31px (1.4) | 0px |
| `Heading/H4` | Manrope | 18px | SemiBold (600) | 27px (1.5) | 0px |
| `Body/Large` | Inter | 18px | Regular (400) | 29px (1.6) | 0px |
| `Body/Default` | Inter | 16px | Regular (400) | 26px (1.6) | 0px |
| `Body/Small` | Inter | 14px | Regular (400) | 21px (1.5) | 0px |
| `Label` | Inter | 12px | Medium (500) | 17px (1.4) | 0.5px |
| `Data/Large` | JetBrains Mono | 32px | Bold (700) | 38px (1.2) | -0.5px |
| `Data/Default` | JetBrains Mono | 20px | SemiBold (600) | 26px (1.3) | 0px |

**To create text style:**
1. Create text box (T key)
2. Set font, size, weight, line height
3. Right-click text → **"Create Style"**
4. Name according to convention above

---

### 2.3 Effect Styles (Shadows)

Create rectangles with these shadow effects:

| Style Name | Shadow Settings |
|------------|-----------------|
| `Shadow/Small` | X:0, Y:1, Blur:2, Spread:0, Color:#000 10% |
| `Shadow/Medium` | X:0, Y:4, Blur:6, Spread:-1, Color:#000 10% |
| `Shadow/Large` | X:0, Y:10, Blur:15, Spread:-3, Color:#000 10% |
| `Shadow/XL` | X:0, Y:20, Blur:25, Spread:-5, Color:#000 10% |

**To create effect style:**
1. Draw rectangle
2. Add drop shadow effect (Effects panel)
3. Configure shadow settings
4. Right-click effect → **"Create Style"**

---

### 2.4 Grid & Layout

**Mobile Grid (375px frame):**
- Type: Columns
- Count: 4
- Margin: 16px
- Gutter: 16px
- Color: Red at 10% opacity

**Desktop Grid (1440px frame):**
- Type: Columns
- Count: 12
- Margin: 80px
- Gutter: 24px
- Color: Red at 10% opacity

**To apply:**
1. Select frame
2. Layout Grid panel (right sidebar)
3. Click **"+"** → Configure settings above

---

## 3. Component Library Setup

### 3.1 Component Structure

Navigate to **Components Library** page.

Create a structured layout:

```
Components Library Page Layout:
├── Buttons (Primary, Secondary, Ghost, Danger)
├── Cards (Default, Elevated, Outlined, Interactive)
├── Form Elements (Input, Select, Checkbox, Radio)
├── Data Display (Table, Badge, Chart placeholder)
├── Feedback (Alert, Toast, Modal)
├── Navigation (Tab Bar, Top Bar, Side Nav)
└── Icons (Common icons from Lucide)
```

---

### 3.2 Button Component

**Step 1: Create Base Button**

1. Draw rectangle: 120px width, 40px height
2. Border radius: 8px
3. Fill: `Primary/Base` color style
4. Add padding using Auto Layout:
   - Horizontal padding: 16px
   - Vertical padding: 8px

**Step 2: Add Text**

1. Inside rectangle, add text: "Button"
2. Apply text style: `Body/Default`
3. Text color: White (#FFFFFF)
4. Center align

**Step 3: Convert to Auto Layout**

1. Select rectangle + text
2. Press: **Shift + A** (or right-click → "Add Auto Layout")
3. Set spacing: 8px between icon and text
4. Set padding: 8px vertical, 16px horizontal
5. Alignment: Center (both axes)

**Step 4: Create Component**

1. Select button
2. Press: **Ctrl/Cmd + Alt + K** (or right-click → "Create Component")
3. Name: "Button/Primary/Medium"

**Step 5: Create Variants**

Create variants for different states:

1. Select component
2. Right-click → **"Add Variant"**
3. Create variants:
   - **Type:** Primary, Secondary, Ghost, Danger
   - **Size:** Small (32px), Medium (40px), Large (48px)
   - **State:** Default, Hover, Active, Disabled, Loading

**Variant Properties to Configure:**

| Variant | Changes |
|---------|---------|
| **Primary/Default** | Fill: `Primary/Base` |
| **Primary/Hover** | Fill: `Primary/Dark`, Scale: 102% |
| **Primary/Disabled** | Opacity: 50% |
| **Secondary/Default** | Fill: Transparent, Stroke: 2px `Primary/Base` |
| **Ghost/Default** | Fill: Transparent, no stroke |
| **Danger/Default** | Fill: `Error` |

**Pro Tip:** Use component properties panel to define variant properties (Type, Size, State).

---

### 3.3 Card Component

**Step 1: Create Base Card**

1. Draw frame: 343px width (mobile), flexible height
2. Fill: White (`Neutral/50` for light mode)
3. Border radius: 12px
4. Effect: `Shadow/Medium`
5. Padding: 16px (mobile), 24px (desktop)

**Step 2: Add Card Content Structure**

Inside card frame, add:
- **Header:** Text with `Heading/H4` style
- **Body:** Text with `Body/Default` style
- **Footer:** Button component (optional)

**Step 3: Convert to Auto Layout**

1. Select card frame
2. Apply Auto Layout (Shift + A)
3. Direction: Vertical
4. Spacing: 16px between header/body/footer
5. Padding: 16px all sides

**Step 4: Create Component**

1. Select card
2. Create component: **Ctrl/Cmd + Alt + K**
3. Name: "Card/Default"

**Step 5: Create Variants**

- **Type:** Default, Elevated, Outlined, Interactive
- **State:** Default, Hover (for Interactive type)

---

### 3.4 Data Table Component

**Step 1: Create Table Header**

1. Draw frame: Full width, 48px height
2. Fill: `Neutral/100`
3. Add text columns: Asset, Price, 24h Change, Holdings, Risk
4. Apply text style: `Label`
5. Use Auto Layout with horizontal direction, space between

**Step 2: Create Table Row**

1. Draw frame: Full width, 56px height
2. Fill: White (default), `Neutral/50` (hover)
3. Add text for each column
4. Apply text style: `Body/Default` (text), `Data/Default` (numbers)
5. Use Auto Layout

**Step 3: Assemble Table**

1. Stack header + multiple rows
2. Apply Auto Layout vertically
3. Add dividers between rows (1px line, `Neutral/100`)

**Step 4: Create Component**

1. Select entire table
2. Create component: "Table/Holdings"
3. Make rows repeatable using component variants

---

### 3.5 Badge Component

**Step 1: Create Base Badge**

1. Draw small rectangle: Auto width, 24px height
2. Border radius: 12px (pill shape)
3. Fill: `Success` color (for Low Risk)
4. Padding: 6px horizontal, 4px vertical

**Step 2: Add Text**

1. Add text inside: "Low Risk"
2. Apply text style: `Label`
3. Text color: White or dark color (ensure 4.5:1 contrast)

**Step 3: Convert to Auto Layout**

1. Select badge
2. Apply Auto Layout
3. Set padding: 6px horizontal, 4px vertical
4. Add icon (optional): Use Lucide icon placeholder

**Step 4: Create Component with Variants**

Variants:
- **Type:** Risk (Low/Medium/High/Extreme), Confidence (High/Med/Low), Price Change (+/-), Plan (Free/Plus/Pro)
- **Size:** Small, Medium, Large

**Color Mapping:**
- Low Risk: `Success` (Green)
- Medium Risk: `Warning` (Yellow)
- High Risk: Orange (#FB923C)
- Extreme Risk: `Error` (Red)

---

### 3.6 Navigation Components

**Bottom Tab Bar (Mobile):**

1. Draw frame: 375px width, 64px height
2. Fill: White or `Dark/Surface` (dark mode)
3. Add 4 tabs: Dashboard, Predictions, Risk, Settings
4. Each tab contains:
   - Icon (24px, Lucide icon placeholder)
   - Label text (`Label` style)
5. Use Auto Layout: Horizontal, space evenly
6. Add active state (Primary color for selected tab)

**Top Bar:**

1. Draw frame: Full width, 56px height
2. Sections:
   - Left: Logo (40px)
   - Center: Search bar (flexible width)
   - Right: Notification bell + Avatar (40px each)
3. Use Auto Layout: Horizontal, space between
4. Padding: 16px horizontal

---

## 4. Screen Mockups

### 4.1 Mobile Screens Setup

Navigate to **Mobile Screens** page.

**Create Base Frame:**
1. Press **F** (Frame tool)
2. Select **"iPhone 14 Pro"** (393 x 852px) from right panel
3. Apply mobile grid (4 columns, 16px margin)

**Screens to Create:**

1. **Dashboard**
   - Top bar (logo, search, notifications, avatar)
   - Portfolio value card (large)
   - Quick actions (3 buttons)
   - Asset allocation pie chart
   - Top 10 holdings table
   - Recent transactions list
   - Bottom tab navigation

2. **AI Predictions - Market Overview**
   - Top bar (back, title, filter, share)
   - Timeframe tabs (7d, 14d, 30d)
   - BTC prediction card
   - ETH prediction card
   - "View 50+ assets" button (locked for free users)
   - Bottom tab navigation

3. **Risk Analysis**
   - Top bar
   - Portfolio risk gauge (hero)
   - Risk distribution chart
   - Highest risk holdings (top 5)
   - Rebalancing suggestions card
   - Bottom tab navigation

4. **Asset Detail**
   - Top bar (back, asset name, star, share)
   - Asset header (icon, price, change %)
   - Price chart
   - Tab navigation (Overview, Prediction, Risk, Holdings)
   - Tab content
   - Action buttons (Set Alert, Trade)
   - Bottom tab navigation

5. **Onboarding - Connect Exchange**
   - Progress indicator (Step 2 of 3)
   - Header text
   - Exchange list (grid with logos)
   - Selected exchange screen
   - API key input fields
   - Security notice
   - Connect button

6. **Settings - Subscription**
   - Top bar
   - Current plan card
   - Pricing comparison table
   - Billing info (for paid users)
   - Usage stats
   - Bottom tab navigation

---

### 4.2 Desktop Screens Setup

Navigate to **Desktop Screens** page.

**Create Base Frame:**
1. Press **F** (Frame tool)
2. Select **"Desktop"** (1440 x 1024px)
3. Apply desktop grid (12 columns, 80px margin, 24px gutter)

**Layout Structure:**
- **Left Sidebar:** 240px width, persistent navigation
- **Main Content:** Flexible width (remaining space)
- **Right Sidebar (optional):** 320px width for alerts/updates

**Screens to Create:**

Adapt mobile screens for desktop:
- Use 3-column layouts where appropriate
- Expand charts to larger sizes
- Show more data (full transaction history, all holdings)
- Add hover states to interactive elements

---

## 5. Interactive Prototype

### 5.1 Create Prototype Connections

1. Switch to **Prototype** tab (top right)
2. Select screen frame
3. Drag connection from button/element to target screen
4. Configure interaction:
   - **Trigger:** On click / On tap
   - **Action:** Navigate to
   - **Destination:** Target screen
   - **Animation:** Instant / Dissolve / Move (choose appropriate)

**Key Flows to Prototype:**

- Onboarding: Welcome → Connect Exchange → Dashboard
- Dashboard → Asset Detail → Back to Dashboard
- Dashboard → Predictions → Back to Dashboard
- Dashboard → Risk → Back to Dashboard
- Tap bottom nav to switch between main screens

---

### 5.2 Add Micro-interactions

**Button Hover States:**
1. Create hover variant of button component
2. In prototype mode, connect Default → Hover
3. Trigger: **While Hovering**
4. Animation: **Instant** or **Smart Animate** (150ms)

**Modal Overlays:**
1. Create modal component on separate layer
2. Set modal background to 50% opacity black
3. Connect trigger button → Modal screen
4. Animation: **Dissolve** (200ms)

---

## 6. Design Tokens Export

### 6.1 Prepare for Developer Handoff

**Style Guide Page:**
1. Create comprehensive style guide showing:
   - All color styles with hex codes
   - Typography scale with examples
   - Component library with all variants
   - Spacing system
   - Grid structure

**Figma Plugins for Export:**

1. **Design Tokens:**
   - Install "Design Tokens" plugin
   - Export colors, typography, spacing as JSON
   - Share JSON file with developers

2. **Figma to Code:**
   - Install "Figma to Code" plugin
   - Select component → Generate React/Tailwind code
   - Use as reference for developers

---

## 7. Collaboration & Handoff

### 7.1 Share Figma File

1. Click **"Share"** button (top right)
2. Add team members or developers
3. Set permissions:
   - **View:** For developers (read-only)
   - **Edit:** For designers

### 7.2 Create Figma Dev Mode

1. Enable **Dev Mode** (bottom right toggle)
2. Developers can:
   - Inspect spacing, colors, fonts
   - Copy CSS/React code
   - Export assets
   - View measurements

### 7.3 Documentation

Add annotations to screens:
1. Use **Comment tool** (C key)
2. Add notes explaining:
   - Interaction behaviors
   - Conditional states
   - Edge cases
   - Responsive behavior

---

## 8. Maintenance & Versioning

### 8.1 Version Control

**Branching Strategy:**
1. Create branch for major changes: **File → Branches → Create branch**
2. Name branches: `feature/new-component`, `update/color-system`
3. Merge after review

### 8.2 Component Updates

When updating components:
1. Update main component in Components Library page
2. Changes automatically propagate to all instances
3. If breaking change, create new component version

### 8.3 Keep Design System in Sync

Regular maintenance:
1. Weekly review of component usage
2. Monthly audit of color/typography consistency
3. Quarterly updates based on user feedback

---

## 9. Resources

### 9.1 Figma Learning

- [Figma Documentation](https://help.figma.com/)
- [Figma YouTube Channel](https://www.youtube.com/c/Figmadesign)
- [Figma Community](https://www.figma.com/community) - Browse design systems for inspiration

### 9.2 Design System Examples

Study these Figma design systems:
- [Material Design 3](https://www.figma.com/community/file/1035203688168086460)
- [Ant Design](https://www.figma.com/community/file/831698976089873405)
- [Shadcn UI](https://www.figma.com/community/file/1203061493325953101)

### 9.3 Crypto UI Inspiration

- CoinStats app screenshots
- Delta portfolio tracker
- CoinMarketCap mobile app
- Robinhood crypto UI
- Binance trading interface

---

## 10. Checklist

**Design Tokens:**
- [ ] 13 color styles created
- [ ] 10 typography styles created
- [ ] 4 shadow effect styles created
- [ ] Mobile grid configured
- [ ] Desktop grid configured

**Components:**
- [ ] Button (4 variants, 3 sizes, 5 states)
- [ ] Card (4 types)
- [ ] Data table
- [ ] Badge (4 types, 3 sizes)
- [ ] Navigation (Bottom bar, Top bar)
- [ ] Form elements (Input, Select, Checkbox)
- [ ] Feedback (Alert, Toast, Modal)

**Screens:**
- [ ] Mobile: Dashboard
- [ ] Mobile: AI Predictions
- [ ] Mobile: Risk Analysis
- [ ] Mobile: Asset Detail
- [ ] Mobile: Onboarding
- [ ] Mobile: Settings
- [ ] Desktop: All screens adapted

**Prototype:**
- [ ] Main navigation flow
- [ ] Onboarding flow
- [ ] Hover states
- [ ] Modal interactions

**Handoff:**
- [ ] Style guide page created
- [ ] Design tokens exported
- [ ] File shared with developers
- [ ] Dev mode enabled
- [ ] Documentation added

---

**Document Complete!**

This guide provides everything needed to create the Coinsphere design system in Figma. Estimated completion time: 8-12 hours for a designer familiar with Figma.

**Next:** See [storybook-setup-guide.md](storybook-setup-guide.md) for implementing the design system in code.

---

**END OF DOCUMENT**
