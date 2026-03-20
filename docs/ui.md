# HireFlow UI Design System Reference

Complete design system documentation for replicating the HireFlow dark-themed recruitment platform UI.

---

## 1. Theme Mode

- **Mode**: Dark only (no light mode)
- **HTML class**: `<html class="dark">`
- **CSS Strategy**: CSS custom properties (HSL format without `hsl()` wrapper), consumed via `hsl(var(--token))` in Tailwind config

---

## 2. Color Palette

All values are HSL (hue saturation% lightness%) without the `hsl()` function wrapper.

### Core Colors

| Token                    | HSL Value          | Hex Approx   | Usage                              |
|--------------------------|--------------------|--------------|------------------------------------|
| `--background`           | `240 6% 3.9%`     | `#0a0a0b`    | Page background                    |
| `--foreground`           | `0 0% 98%`        | `#fafafa`    | Primary text                       |
| `--card`                 | `240 5% 10%`      | `#181819`    | Card/panel backgrounds             |
| `--card-foreground`      | `0 0% 98%`        | `#fafafa`    | Card text                          |
| `--popover`              | `240 5% 10%`      | `#181819`    | Popover/dropdown backgrounds       |
| `--popover-foreground`   | `0 0% 98%`        | `#fafafa`    | Popover text                       |

### Brand / Action Colors

| Token                      | HSL Value          | Hex Approx   | Usage                            |
|----------------------------|--------------------|--------------|----------------------------------|
| `--primary`                | `217 91% 60%`     | `#3b82f6`    | Primary buttons, links, active states |
| `--primary-foreground`     | `0 0% 100%`       | `#ffffff`    | Text on primary                  |
| `--secondary`              | `240 4% 16%`      | `#272729`    | Secondary buttons, subtle backgrounds |
| `--secondary-foreground`   | `0 0% 98%`        | `#fafafa`    | Text on secondary                |
| `--accent`                 | `240 4% 16%`      | `#272729`    | Hover backgrounds, accent areas  |
| `--accent-foreground`      | `0 0% 98%`        | `#fafafa`    | Text on accent                   |

### Semantic Colors

| Token                      | HSL Value          | Hex Approx   | Usage                            |
|----------------------------|--------------------|--------------|----------------------------------|
| `--destructive`            | `0 84% 60%`       | `#ef4444`    | Delete, error, danger            |
| `--destructive-foreground` | `0 0% 98%`        | `#fafafa`    | Text on destructive              |
| `--success`                | `160 84% 39%`     | `#10b981`    | Success states, passed, active   |
| `--success-foreground`     | `0 0% 100%`       | `#ffffff`    | Text on success                  |
| `--warning`                | `38 92% 50%`      | `#f59e0b`    | Warnings, medium difficulty      |
| `--warning-foreground`     | `0 0% 0%`         | `#000000`    | Text on warning                  |

### Muted / Utility Colors

| Token                    | HSL Value          | Hex Approx   | Usage                            |
|--------------------------|--------------------|--------------|----------------------------------|
| `--muted`                | `240 4% 16%`      | `#272729`    | Muted backgrounds                |
| `--muted-foreground`     | `240 5% 65%`      | `#a1a1a6`    | Secondary text, labels, captions |
| `--border`               | `240 4% 16%`      | `#272729`    | Borders, dividers                |
| `--input`                | `240 4% 16%`      | `#272729`    | Input field borders              |
| `--ring`                 | `217 91% 60%`     | `#3b82f6`    | Focus ring                       |

### Sidebar Colors

| Token                          | HSL Value          | Usage                         |
|--------------------------------|--------------------|-------------------------------|
| `--sidebar-background`         | `240 6% 3.9%`     | Sidebar background            |
| `--sidebar-foreground`         | `240 5% 65%`      | Sidebar text (inactive links) |
| `--sidebar-primary`            | `217 91% 60%`     | Sidebar active link highlight |
| `--sidebar-primary-foreground` | `0 0% 100%`       | Active link text              |
| `--sidebar-accent`             | `240 4% 16%`      | Sidebar hover/active bg       |
| `--sidebar-accent-foreground`  | `0 0% 98%`        | Sidebar hover text            |
| `--sidebar-border`             | `240 4% 16%`      | Sidebar border                |
| `--sidebar-ring`               | `217 91% 60%`     | Sidebar focus ring            |

### Special

| Token                   | HSL Value     | Usage                    |
|-------------------------|---------------|--------------------------|
| `--editor-background`   | `0 0% 0%`    | Code editor background   |

---

## 3. Typography

### Font Families

| Role      | Font                   | CSS Variable         | Tailwind Class  | Google Fonts URL |
|-----------|------------------------|----------------------|-----------------|------------------|
| Headings  | Plus Jakarta Sans      | `--font-heading`     | `font-heading`  | `Plus+Jakarta+Sans:wght@400;500;600;700;800` |
| Body      | Inter                  | `--font-body`        | `font-body`     | `Inter:wght@300;400;500;600;700` |
| Monospace | JetBrains Mono         | `--font-mono`        | `font-mono`     | `JetBrains+Mono:wght@400;500;600` |

### Google Fonts Import

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
```

### Typography Scale (Tailwind classes used)

| Element             | Classes                                          |
|---------------------|--------------------------------------------------|
| Page title (h1)     | `font-heading text-2xl font-bold text-foreground` |
| Section heading     | `font-heading text-base font-semibold text-foreground` |
| Subsection label    | `text-xs uppercase tracking-wider font-semibold text-foreground` |
| Body text           | `text-sm text-muted-foreground leading-relaxed`  |
| Small label/caption | `text-xs text-muted-foreground`                   |
| Mono/code text      | `font-mono text-xs` or `font-mono text-sm`        |
| Badge text          | `text-xs font-medium`                              |

---

## 4. Spacing & Layout

### Border Radius

| Token  | Value                        | Tailwind    |
|--------|------------------------------|-------------|
| `lg`   | `var(--radius)` = `0.5rem`   | `rounded-lg` |
| `md`   | `calc(var(--radius) - 2px)`  | `rounded-md` |
| `sm`   | `calc(var(--radius) - 4px)`  | `rounded-sm` |
| `full` | `9999px`                     | `rounded-full` |

### Container

- Max width: `1400px` at `2xl` breakpoint
- Centered with `padding: 2rem`

### Common Spacing Patterns

| Context            | Padding/Gap        |
|--------------------|--------------------|
| Page content       | `p-6`              |
| Card padding       | `p-4` to `p-6`     |
| Sidebar width      | `w-60` (240px)     |
| Header height      | `h-14` (56px)      |
| Button gaps        | `gap-2` to `gap-3` |
| Form field spacing  | `space-y-4`        |
| Section spacing     | `space-y-6`        |

---

## 5. Component Patterns

### Buttons

```
Primary:    bg-primary text-primary-foreground hover:bg-primary/90
Secondary:  bg-secondary text-secondary-foreground hover:bg-secondary/80
Outline:    border border-input bg-background hover:bg-accent hover:text-accent-foreground
Ghost:      hover:bg-accent hover:text-accent-foreground
Destructive: bg-destructive text-destructive-foreground hover:bg-destructive/90
Link:       text-primary underline-offset-4 hover:underline
```

**Sizes:**
- Default: `h-10 px-4 py-2`
- Small: `h-9 px-3 rounded-md`
- Large: `h-11 px-8 rounded-md`
- Icon: `h-10 w-10`

### Cards

```
Background: bg-card (hsl(240 5% 10%))
Border:     border border-border
Radius:     rounded-lg
Padding:    p-4 to p-6
```

### Inputs

```
Height:     h-10
Background: bg-background
Border:     border border-input
Radius:     rounded-md
Focus:      ring-2 ring-ring ring-offset-2 ring-offset-background
Font size:  text-base (mobile) / text-sm (md+)
Placeholder: text-muted-foreground
```

### Badges / Status Chips

```
Difficulty Easy:   bg-success/10 text-success border-success/20
Difficulty Medium: bg-warning/10 text-warning border-warning/20
Difficulty Hard:   bg-destructive/10 text-destructive border-destructive/20
Status Active:     bg-success/10 text-success
Status Pending:    bg-warning/10 text-warning
Status Rejected:   bg-destructive/10 text-destructive
General:           bg-secondary text-secondary-foreground rounded-full px-2 py-0.5 text-xs
```

### Sidebar

```
Width:      w-60 (240px)
Position:   fixed left-0 top-0 h-screen
Background: bg-sidebar (--sidebar-background)
Border:     border-r border-border
Nav links:
  - Inactive: text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground
  - Active:   bg-sidebar-accent text-foreground
  - Shape:    rounded-md px-3 py-2 text-sm font-medium
  - Icons:    h-4 w-4, gap-3 from text
```

### Header

```
Height:     h-14 (56px)
Background: bg-background
Border:     border-b border-border
Content:    px-6, flex items-center justify-between
```

### Tables

```
Header row: bg-secondary/50 text-muted-foreground text-xs uppercase
Body rows:  border-b border-border hover:bg-secondary/30
Cell padding: px-4 py-3
Text:       text-sm text-foreground (values), text-muted-foreground (secondary)
```

---

## 6. Motion & Animations

### Keyframes (in tailwind.config.ts)

```js
keyframes: {
  "accordion-down": {
    from: { height: "0" },
    to: { height: "var(--radix-accordion-content-height)" },
  },
  "accordion-up": {
    from: { height: "var(--radix-accordion-content-height)" },
    to: { height: "0" },
  },
  "fade-in": {
    from: { opacity: "0", transform: "translateY(4px)" },
    to: { opacity: "1", transform: "translateY(0)" },
  },
}
```

### Animation Classes

| Class                | Duration | Easing   | Effect                         |
|----------------------|----------|----------|--------------------------------|
| `animate-fade-in`    | 0.2s     | ease-out | Fade in + slide up 4px         |
| `animate-accordion-down` | 0.2s | ease-out | Expand accordion content       |
| `animate-accordion-up`   | 0.2s | ease-out | Collapse accordion content     |

### Transition Patterns

- Buttons/links: `transition-colors` (color transitions on hover)
- Interactive elements: `transition-all duration-200`
- Page content entrance: `animate-fade-in` on `<main>`

---

## 7. Icon System

- **Library**: Lucide React (`lucide-react`)
- **Default size**: `h-4 w-4` (16px)
- **Large icons**: `h-5 w-5` (20px)
- **Color**: Inherits from text color, often `text-muted-foreground`

### Commonly Used Icons

```
LayoutDashboard, Search, FileText, Sparkles, User, PlusCircle,
Users, BarChart3, Clock, Play, Send, Maximize2, Minus, Plus,
ChevronLeft, ChevronRight, Upload, Eye, X, Check, AlertCircle,
LogOut, Settings, Briefcase, MapPin, Calendar, Star, Target
```

---

## 8. UI Component Library

- **Base**: shadcn/ui (Radix UI primitives + Tailwind styling)
- **Key components used**: Button, Badge, Card, Input, Select, Textarea, Dialog, Tabs, Table, Separator, Progress, Checkbox, RadioGroup, ScrollArea, Sheet, Tooltip, Toast/Sonner
- **Resizable panels**: `react-resizable-panels`
- **Charts**: `recharts`
- **Forms**: `react-hook-form` + `zod` + `@hookform/resolvers`
- **Routing**: `react-router-dom` v6

---

## 9. Layout Architecture

### Dashboard Layout (most pages)

```
┌──────────────────────────────────────────────┐
│ Sidebar (w-60, fixed)  │  Header (h-14)      │
│                        │──────────────────────│
│  Logo                  │  Main Content (p-6)  │
│  Nav Links             │  animate-fade-in     │
│  ...                   │                      │
│  User Avatar           │                      │
└──────────────────────────────────────────────┘
Main content: ml-60 (offset for sidebar)
```

### Full-Screen Exam Layout (assessment pages)

```
┌──────────────────────────────────────────────┐
│ Exam Header (border-b, px-4 py-2)            │
│  Problem tabs | Timer | Submit All           │
├──────────────────┬───────────────────────────│
│ Problem Panel    │ Code Editor Panel          │
│ (scrollable)     │ (textarea, font-mono)      │
│                  │                            │
│                  ├───────────────────────────│
│                  │ Action Bar (Run/Submit)    │
│                  │ Results Panel              │
└──────────────────┴───────────────────────────┘
Split: resizable, default 50/50
```

### Auth Pages (no sidebar/header)

```
Centered card on dark background
Max width: max-w-md
Card: bg-card border rounded-lg p-6-8
```

---

## 10. Dark Theme Global Styles

```css
/* Applied to all elements */
* { border-color: hsl(var(--border)); }

/* Body */
body {
  background: hsl(var(--background));   /* near-black */
  color: hsl(var(--foreground));        /* near-white */
  font-family: 'Inter', sans-serif;
  -webkit-font-smoothing: antialiased;
}

/* All headings */
h1-h6 { font-family: 'Plus Jakarta Sans', sans-serif; }
```

---

## 11. Tailwind Config Essentials

```js
// tailwind.config.ts
{
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        heading: ['Plus Jakarta Sans', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        // All use hsl(var(--token)) pattern
        border, input, ring, background, foreground,
        primary: { DEFAULT, foreground },
        secondary: { DEFAULT, foreground },
        destructive: { DEFAULT, foreground },
        success: { DEFAULT, foreground },
        warning: { DEFAULT, foreground },
        muted: { DEFAULT, foreground },
        accent: { DEFAULT, foreground },
        popover: { DEFAULT, foreground },
        card: { DEFAULT, foreground },
        sidebar: { DEFAULT, foreground, primary, "primary-foreground", accent, "accent-foreground", border, ring },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
```

---

## 12. Key Design Principles

1. **Near-black backgrounds** — Page bg is `3.9% lightness`, cards are `10%`, creating subtle depth
2. **Blue as the only accent** — `hsl(217 91% 60%)` for all interactive/primary elements
3. **Muted secondary text** — `65% lightness` gray for non-critical information
4. **Minimal borders** — Same color as secondary bg (`16% lightness`), barely visible
5. **Monospace for data** — JetBrains Mono for scores, timers, code, and technical data
6. **Semantic color coding** — Green=success, Yellow=warning, Red=destructive consistently
7. **Opacity-based badges** — `bg-color/10 text-color border-color/20` pattern for soft badges
8. **No shadows** — Depth via background color layering, not box-shadows
9. **Compact UI** — Small text sizes (`text-xs`, `text-sm`), tight padding for information density
