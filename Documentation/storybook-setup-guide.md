# Storybook Setup Guide - Coinsphere

**Document Version**: 1.0
**Date**: October 6, 2025
**Related Documents**:
- [front-end-spec.md](front-end-spec.md)
- [figma-setup-guide.md](figma-setup-guide.md)

---

## Overview

This guide provides step-by-step instructions for setting up Storybook with Shadcn/ui components, Tailwind CSS, and React for the Coinsphere design system.

**Tech Stack:**
- React 18 + TypeScript
- Tailwind CSS 3.4+
- Shadcn/ui components
- Storybook 8
- Vite (build tool)

**Estimated Time:** 4-6 hours for complete setup

---

## 1. Prerequisites

### 1.1 Install Required Tools

Ensure you have installed:
- **Node.js** 20+ and **npm** 10+
- **Git** for version control
- **Code editor** (VS Code recommended)

Verify installations:
```bash
node --version  # Should show v20+
npm --version   # Should show v10+
```

---

## 2. Project Initialization

### 2.1 Create React + TypeScript Project

```bash
# Create new Vite project
npm create vite@latest coinsphere-ui -- --template react-ts

# Navigate to project
cd coinsphere-ui

# Install dependencies
npm install
```

### 2.2 Install Tailwind CSS

```bash
# Install Tailwind and its peer dependencies
npm install -D tailwindcss postcss autoprefixer

# Initialize Tailwind config
npx tailwindcss init -p
```

**Update `tailwind.config.js`:**

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#3B82F6',
          dark: '#2563EB',
        },
        secondary: {
          DEFAULT: '#8B5CF6',
        },
        accent: {
          DEFAULT: '#10B981',
        },
        success: '#22C55E',
        warning: '#F59E0B',
        error: '#EF4444',
        neutral: {
          50: '#F9FAFB',
          100: '#F3F4F6',
          500: '#6B7280',
          900: '#111827',
        },
        dark: {
          background: '#0F172A',
          surface: '#1E293B',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        heading: ['Manrope', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
```

**Update `src/index.css`:**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Import Google Fonts */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Manrope:wght@400;600;700&family=JetBrains+Mono:wght@400&display=swap');

@layer base {
  body {
    @apply font-sans text-neutral-900 bg-neutral-50;
  }

  h1, h2, h3, h4, h5, h6 {
    @apply font-heading;
  }
}
```

---

## 3. Install Shadcn/ui

### 3.1 Initialize Shadcn/ui

```bash
# Install Shadcn CLI
npx shadcn-ui@latest init
```

**Configuration prompts:**
- Would you like to use TypeScript? → **Yes**
- Which style would you like to use? → **Default**
- Which color would you like to use as base color? → **Blue**
- Where is your global CSS file? → **src/index.css**
- Would you like to use CSS variables for colors? → **Yes**
- Where is your tailwind.config.js located? → **tailwind.config.js**
- Configure the import alias for components? → **@/components**
- Configure the import alias for utils? → **@/lib/utils**

### 3.2 Install Core Components

```bash
# Install all components needed for Coinsphere
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add table
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add alert
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add input
npx shadcn-ui@latest add select
npx shadcn-ui@latest add checkbox
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add toast
npx shadcn-ui@latest add dropdown-menu
```

---

## 4. Install Storybook

### 4.1 Initialize Storybook

```bash
# Install and configure Storybook
npx storybook@latest init
```

This will:
- Detect your project type (Vite + React)
- Install Storybook dependencies
- Create `.storybook/` folder
- Add example stories

### 4.2 Configure Storybook for Tailwind

**Update `.storybook/preview.ts`:**

```typescript
import type { Preview } from "@storybook/react";
import '../src/index.css'; // Import Tailwind styles

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: "^on[A-Z].*" },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: 'light',
      values: [
        {
          name: 'light',
          value: '#F9FAFB',
        },
        {
          name: 'dark',
          value: '#0F172A',
        },
      ],
    },
  },
};

export default preview;
```

**Update `.storybook/main.ts`:**

```typescript
import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  stories: ["../src/**/*.mdx", "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  addons: [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "@storybook/addon-onboarding",
    "@storybook/addon-interactions",
    "@storybook/addon-a11y", // Accessibility addon
  ],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  docs: {
    autodocs: "tag",
  },
};
export default config;
```

### 4.3 Install Additional Storybook Addons

```bash
# Accessibility testing
npm install --save-dev @storybook/addon-a11y

# Dark mode toggle
npm install --save-dev storybook-dark-mode
```

---

## 5. Create Component Stories

### 5.1 Button Component Story

**Create `src/components/ui/Button.stories.tsx`:**

```typescript
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './button';

const meta = {
  title: 'Components/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'],
    },
    size: {
      control: 'select',
      options: ['default', 'sm', 'lg', 'icon'],
    },
    disabled: {
      control: 'boolean',
    },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    children: 'Button',
    variant: 'default',
  },
};

export const Secondary: Story = {
  args: {
    children: 'Button',
    variant: 'secondary',
  },
};

export const Destructive: Story = {
  args: {
    children: 'Delete',
    variant: 'destructive',
  },
};

export const Outline: Story = {
  args: {
    children: 'Button',
    variant: 'outline',
  },
};

export const Ghost: Story = {
  args: {
    children: 'Button',
    variant: 'ghost',
  },
};

export const Small: Story = {
  args: {
    children: 'Small Button',
    size: 'sm',
  },
};

export const Large: Story = {
  args: {
    children: 'Large Button',
    size: 'lg',
  },
};

export const Disabled: Story = {
  args: {
    children: 'Disabled',
    disabled: true,
  },
};

export const WithIcon: Story = {
  args: {
    children: (
      <>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="mr-2"
        >
          <path d="M5 12h14" />
          <path d="m12 5 7 7-7 7" />
        </svg>
        Next
      </>
    ),
  },
};
```

---

### 5.2 Card Component Story

**Create `src/components/ui/Card.stories.tsx`:**

```typescript
import type { Meta, StoryObj } from '@storybook/react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './card';
import { Button } from './button';

const meta = {
  title: 'Components/Card',
  component: Card,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Portfolio Value</CardTitle>
        <CardDescription>Total value across all accounts</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-4xl font-bold font-mono">$52,845.23</div>
        <div className="text-success text-sm mt-2">+12.5% (24h)</div>
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="w-full">View Details</Button>
      </CardFooter>
    </Card>
  ),
};

export const PredictionCard: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-2xl">📈</span>
          Bitcoin (BTC)
        </CardTitle>
        <CardDescription>7-day prediction</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <span className="text-xl font-bold text-success">Bullish</span>
          <span className="bg-success text-white px-3 py-1 rounded-full text-sm">High Confidence</span>
        </div>
        <div className="text-sm text-neutral-500">
          <div className="mb-2">
            <strong>Why this prediction?</strong>
          </div>
          <ul className="space-y-1">
            <li>• RSI: 65 (Overbought)</li>
            <li>• MACD: Bullish crossover</li>
            <li>• Volume: +35% above average</li>
          </ul>
        </div>
      </CardContent>
      <CardFooter className="text-xs text-neutral-500">
        72% accurate over last 30 days
      </CardFooter>
    </Card>
  ),
};

export const RiskCard: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Portfolio Risk Score</CardTitle>
        <CardDescription>Overall risk assessment</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center mb-4">
          <div className="relative w-32 h-32">
            <svg viewBox="0 0 100 100" className="transform -rotate-90">
              <circle cx="50" cy="50" r="40" stroke="#F3F4F6" strokeWidth="8" fill="none" />
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="#F59E0B"
                strokeWidth="8"
                fill="none"
                strokeDasharray="251.2"
                strokeDashoffset="125.6"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center flex-col">
              <span className="text-3xl font-bold">54</span>
              <span className="text-xs text-neutral-500">Medium Risk</span>
            </div>
          </div>
        </div>
        <div className="text-sm text-center text-neutral-500">
          Your portfolio has moderate volatility
        </div>
      </CardContent>
    </Card>
  ),
};
```

---

### 5.3 Badge Component Story

**Create `src/components/ui/Badge.stories.tsx`:**

```typescript
import type { Meta, StoryObj } from '@storybook/react';
import { Badge } from './badge';

const meta = {
  title: 'Components/Badge',
  component: Badge,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'secondary', 'destructive', 'outline'],
    },
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Badge',
  },
};

export const LowRisk: Story = {
  render: () => (
    <Badge className="bg-success text-white">Low Risk</Badge>
  ),
};

export const MediumRisk: Story = {
  render: () => (
    <Badge className="bg-warning text-white">Medium Risk</Badge>
  ),
};

export const HighRisk: Story = {
  render: () => (
    <Badge className="bg-error text-white">High Risk</Badge>
  ),
};

export const PriceUp: Story = {
  render: () => (
    <Badge className="bg-success text-white">+12.5%</Badge>
  ),
};

export const PriceDown: Story = {
  render: () => (
    <Badge className="bg-error text-white">-8.3%</Badge>
  ),
};

export const ProPlan: Story = {
  render: () => (
    <Badge className="bg-secondary text-white">Pro</Badge>
  ),
};
```

---

### 5.4 Data Table Story

**Create `src/components/ui/DataTable.stories.tsx`:**

```typescript
import type { Meta, StoryObj } from '@storybook/react';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './table';
import { Badge } from './badge';

const meta = {
  title: 'Components/DataTable',
  component: Table,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Table>;

export default meta;
type Story = StoryObj<typeof meta>;

const holdings = [
  { asset: 'Bitcoin', symbol: 'BTC', price: '$43,250', change: '+5.2%', value: '$8,650', risk: 'Low' },
  { asset: 'Ethereum', symbol: 'ETH', price: '$2,280', change: '+3.8%', value: '$6,840', risk: 'Low' },
  { asset: 'Cardano', symbol: 'ADA', price: '$0.52', change: '-2.1%', value: '$2,600', risk: 'Medium' },
  { asset: 'Dogecoin', symbol: 'DOGE', price: '$0.08', change: '+12.5%', value: '$1,200', risk: 'High' },
  { asset: 'Shiba Inu', symbol: 'SHIB', price: '$0.000009', change: '-8.3%', value: '$450', risk: 'Extreme' },
];

export const HoldingsTable: Story = {
  render: () => (
    <Table>
      <TableCaption>Your cryptocurrency holdings</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Asset</TableHead>
          <TableHead>Price</TableHead>
          <TableHead>24h Change</TableHead>
          <TableHead>Value</TableHead>
          <TableHead>Risk</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {holdings.map((holding) => (
          <TableRow key={holding.symbol}>
            <TableCell className="font-medium">
              <div>
                <div>{holding.asset}</div>
                <div className="text-sm text-neutral-500">{holding.symbol}</div>
              </div>
            </TableCell>
            <TableCell className="font-mono">{holding.price}</TableCell>
            <TableCell>
              <span className={holding.change.startsWith('+') ? 'text-success' : 'text-error'}>
                {holding.change}
              </span>
            </TableCell>
            <TableCell className="font-mono">{holding.value}</TableCell>
            <TableCell>
              <Badge
                className={
                  holding.risk === 'Low'
                    ? 'bg-success text-white'
                    : holding.risk === 'Medium'
                    ? 'bg-warning text-white'
                    : holding.risk === 'High'
                    ? 'bg-orange-500 text-white'
                    : 'bg-error text-white'
                }
              >
                {holding.risk}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
};
```

---

## 6. Install Chart Library

### 6.1 Install Recharts

```bash
npm install recharts
npm install --save-dev @types/recharts
```

### 6.2 Create Chart Component Story

**Create `src/components/charts/PriceChart.tsx`:**

```typescript
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { time: '00:00', price: 43200 },
  { time: '04:00', price: 43500 },
  { time: '08:00', price: 43100 },
  { time: '12:00', price: 43800 },
  { time: '16:00', price: 44200 },
  { time: '20:00', price: 43900 },
  { time: '24:00', price: 44500 },
];

export function PriceChart() {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
        <XAxis dataKey="time" stroke="#6B7280" />
        <YAxis stroke="#6B7280" />
        <Tooltip
          contentStyle={{
            backgroundColor: '#1E293B',
            border: 'none',
            borderRadius: '8px',
            color: '#fff',
          }}
        />
        <Line type="monotone" dataKey="price" stroke="#3B82F6" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
```

**Create `src/components/charts/PriceChart.stories.tsx`:**

```typescript
import type { Meta, StoryObj } from '@storybook/react';
import { PriceChart } from './PriceChart';

const meta = {
  title: 'Components/Charts/PriceChart',
  component: PriceChart,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof PriceChart>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
```

---

## 7. Install Lucide Icons

### 7.1 Install Lucide React

```bash
npm install lucide-react
```

### 7.2 Create Icon Story

**Create `src/components/icons/Icons.stories.tsx`:**

```typescript
import type { Meta, StoryObj } from '@storybook/react';
import {
  Home,
  TrendingUp,
  Shield,
  Settings,
  Bell,
  Search,
  Plus,
  ArrowUp,
  ArrowDown,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from 'lucide-react';

const meta = {
  title: 'Foundation/Icons',
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} as Meta;

export default meta;

export const AllIcons: StoryObj = {
  render: () => (
    <div className="grid grid-cols-4 gap-8 p-8">
      <div className="flex flex-col items-center gap-2">
        <Home size={24} />
        <span className="text-sm">Home</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <TrendingUp size={24} />
        <span className="text-sm">Predictions</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Shield size={24} />
        <span className="text-sm">Risk</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Settings size={24} />
        <span className="text-sm">Settings</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Bell size={24} />
        <span className="text-sm">Notifications</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Search size={24} />
        <span className="text-sm">Search</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Plus size={24} />
        <span className="text-sm">Add</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <ArrowUp size={24} className="text-success" />
        <span className="text-sm">Up</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <ArrowDown size={24} className="text-error" />
        <span className="text-sm">Down</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <AlertTriangle size={24} className="text-warning" />
        <span className="text-sm">Warning</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <CheckCircle size={24} className="text-success" />
        <span className="text-sm">Success</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <XCircle size={24} className="text-error" />
        <span className="text-sm">Error</span>
      </div>
    </div>
  ),
};
```

---

## 8. Create Design Token Documentation

### 8.1 Colors Story

**Create `src/stories/Colors.stories.tsx`:**

```typescript
import type { Meta, StoryObj } from '@storybook/react';

const meta = {
  title: 'Foundation/Colors',
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} as Meta;

export default meta;

export const ColorPalette: StoryObj = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-xl font-bold mb-4">Primary Colors</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="h-24 bg-primary rounded-lg mb-2"></div>
            <div className="text-sm">Primary</div>
            <div className="text-xs text-neutral-500">#3B82F6</div>
          </div>
          <div>
            <div className="h-24 bg-primary-dark rounded-lg mb-2"></div>
            <div className="text-sm">Primary Dark</div>
            <div className="text-xs text-neutral-500">#2563EB</div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-xl font-bold mb-4">Semantic Colors</h3>
        <div className="grid grid-cols-4 gap-4">
          <div>
            <div className="h-24 bg-success rounded-lg mb-2"></div>
            <div className="text-sm">Success</div>
            <div className="text-xs text-neutral-500">#22C55E</div>
          </div>
          <div>
            <div className="h-24 bg-warning rounded-lg mb-2"></div>
            <div className="text-sm">Warning</div>
            <div className="text-xs text-neutral-500">#F59E0B</div>
          </div>
          <div>
            <div className="h-24 bg-error rounded-lg mb-2"></div>
            <div className="text-sm">Error</div>
            <div className="text-xs text-neutral-500">#EF4444</div>
          </div>
          <div>
            <div className="h-24 bg-secondary rounded-lg mb-2"></div>
            <div className="text-sm">Secondary</div>
            <div className="text-xs text-neutral-500">#8B5CF6</div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-xl font-bold mb-4">Neutral Colors</h3>
        <div className="grid grid-cols-4 gap-4">
          <div>
            <div className="h-24 bg-neutral-50 border border-neutral-100 rounded-lg mb-2"></div>
            <div className="text-sm">Neutral 50</div>
            <div className="text-xs text-neutral-500">#F9FAFB</div>
          </div>
          <div>
            <div className="h-24 bg-neutral-100 rounded-lg mb-2"></div>
            <div className="text-sm">Neutral 100</div>
            <div className="text-xs text-neutral-500">#F3F4F6</div>
          </div>
          <div>
            <div className="h-24 bg-neutral-500 rounded-lg mb-2"></div>
            <div className="text-sm">Neutral 500</div>
            <div className="text-xs text-neutral-500">#6B7280</div>
          </div>
          <div>
            <div className="h-24 bg-neutral-900 rounded-lg mb-2"></div>
            <div className="text-sm">Neutral 900</div>
            <div className="text-xs text-neutral-500">#111827</div>
          </div>
        </div>
      </div>
    </div>
  ),
};
```

### 8.2 Typography Story

**Create `src/stories/Typography.stories.tsx`:**

```typescript
import type { Meta, StoryObj } from '@storybook/react';

const meta = {
  title: 'Foundation/Typography',
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} as Meta;

export default meta;

export const TypeScale: StoryObj = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold font-heading mb-2">Heading 1</h1>
        <p className="text-sm text-neutral-500">36px / 2.25rem · Bold (700) · Manrope</p>
      </div>
      <div>
        <h2 className="text-3xl font-semibold font-heading mb-2">Heading 2</h2>
        <p className="text-sm text-neutral-500">28px / 1.75rem · SemiBold (600) · Manrope</p>
      </div>
      <div>
        <h3 className="text-2xl font-semibold font-heading mb-2">Heading 3</h3>
        <p className="text-sm text-neutral-500">22px / 1.375rem · SemiBold (600) · Manrope</p>
      </div>
      <div>
        <h4 className="text-xl font-semibold font-heading mb-2">Heading 4</h4>
        <p className="text-sm text-neutral-500">18px / 1.125rem · SemiBold (600) · Manrope</p>
      </div>
      <div>
        <p className="text-lg mb-2">Body Large - The quick brown fox jumps over the lazy dog</p>
        <p className="text-sm text-neutral-500">18px / 1.125rem · Regular (400) · Inter</p>
      </div>
      <div>
        <p className="text-base mb-2">Body Default - The quick brown fox jumps over the lazy dog</p>
        <p className="text-sm text-neutral-500">16px / 1rem · Regular (400) · Inter</p>
      </div>
      <div>
        <p className="text-sm mb-2">Body Small - The quick brown fox jumps over the lazy dog</p>
        <p className="text-sm text-neutral-500">14px / 0.875rem · Regular (400) · Inter</p>
      </div>
      <div>
        <div className="text-4xl font-bold font-mono mb-2">$52,845.23</div>
        <p className="text-sm text-neutral-500">32px / 2rem · Bold (700) · JetBrains Mono</p>
      </div>
    </div>
  ),
};
```

---

## 9. Run Storybook

### 9.1 Start Development Server

```bash
# Start Storybook
npm run storybook
```

This will open Storybook at `http://localhost:6006`

### 9.2 Build Static Storybook

```bash
# Build for deployment
npm run build-storybook
```

Output will be in `storybook-static/` folder

---

## 10. Testing & Accessibility

### 10.1 Install Testing Library

```bash
npm install --save-dev @storybook/test @storybook/addon-interactions
```

### 10.2 Add Interaction Tests

**Update Button story with interaction test:**

```typescript
import { within, userEvent } from '@storybook/test';

export const WithInteraction: Story = {
  args: {
    children: 'Click Me',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button');

    await userEvent.click(button);
  },
};
```

### 10.3 Accessibility Testing

Storybook includes accessibility addon by default. Check the "Accessibility" tab in each story to see violations.

**Fix common issues:**
- Add `aria-label` to icon-only buttons
- Ensure proper color contrast (4.5:1 minimum)
- Use semantic HTML (`<button>`, `<nav>`, etc.)

---

## 11. Deployment

### 11.1 Deploy to GitHub Pages

```bash
# Build Storybook
npm run build-storybook

# Install gh-pages
npm install --save-dev gh-pages

# Add deploy script to package.json
# "deploy-storybook": "gh-pages -d storybook-static"

# Deploy
npm run deploy-storybook
```

### 11.2 Deploy to Netlify/Vercel

1. Push code to GitHub
2. Connect repository to Netlify/Vercel
3. Build command: `npm run build-storybook`
4. Publish directory: `storybook-static`

---

## 12. Documentation

### 12.1 Add MDX Documentation

**Create `src/stories/Introduction.mdx`:**

```mdx
import { Meta } from '@storybook/blocks';

<Meta title="Introduction" />

# Coinsphere Design System

Welcome to the Coinsphere design system.

## Getting Started

This Storybook contains all components, patterns, and design tokens used in the Coinsphere application.

### Components

- **Buttons**: Primary actions and interactions
- **Cards**: Content containers
- **Tables**: Data display
- **Charts**: Data visualization
- **Badges**: Status indicators

### Design Tokens

- **Colors**: Brand colors, semantic colors, neutrals
- **Typography**: Font families and type scale
- **Spacing**: Consistent spacing system
- **Shadows**: Elevation and depth

## Tech Stack

- React 18 + TypeScript
- Tailwind CSS
- Shadcn/ui
- Recharts
- Lucide Icons
```

---

## 13. Maintenance

### 13.1 Keep Dependencies Updated

```bash
# Check for updates
npm outdated

# Update dependencies
npm update

# Update Storybook
npx storybook@latest upgrade
```

### 13.2 Component Checklist

When adding new components:
- [ ] Create TypeScript interface
- [ ] Add Tailwind styles
- [ ] Create `.stories.tsx` file
- [ ] Document props in story
- [ ] Add accessibility labels
- [ ] Test keyboard navigation
- [ ] Add interaction tests
- [ ] Check accessibility tab for violations

---

## 14. Resources

### 14.1 Documentation

- [Storybook Docs](https://storybook.js.org/docs)
- [Shadcn/ui Docs](https://ui.shadcn.com)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Recharts Docs](https://recharts.org)
- [Lucide Icons](https://lucide.dev)

### 14.2 Examples

- [Shadcn Storybook Example](https://ui.shadcn.com)
- [Tailwind UI Components](https://tailwindui.com/components)
- [Recharts Examples](https://recharts.org/en-US/examples)

---

## 15. Checklist

**Setup:**
- [ ] Node.js 20+ and npm 10+ installed
- [ ] Vite project created
- [ ] Tailwind CSS configured
- [ ] Shadcn/ui initialized
- [ ] Core components installed
- [ ] Storybook initialized
- [ ] Accessibility addon installed

**Components:**
- [ ] Button stories created
- [ ] Card stories created
- [ ] Badge stories created
- [ ] Table stories created
- [ ] Chart component created
- [ ] Icons documented

**Documentation:**
- [ ] Colors documented
- [ ] Typography documented
- [ ] Introduction page created
- [ ] Component usage examples added

**Testing:**
- [ ] Accessibility violations checked
- [ ] Interaction tests added
- [ ] Keyboard navigation tested

**Deployment:**
- [ ] Storybook built successfully
- [ ] Deployed to hosting platform
- [ ] Team has access to live Storybook

---

**Document Complete!**

This guide provides everything needed to set up Storybook with the Coinsphere design system. Estimated completion time: 4-6 hours.

**Next:** Share the live Storybook URL with developers and designers for design handoff.

---

**END OF DOCUMENT**
