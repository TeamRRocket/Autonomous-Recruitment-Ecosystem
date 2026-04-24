# HireFlow — UI Design System Documentation

## Overview

HireFlow uses a **dark-first, professional** design system built on React + Tailwind CSS + shadcn/ui. The aesthetic is clean, modern, and recruiter-grade — optimized for data-dense interfaces like dashboards, tables, and assessment engines.

---

## Typography

| Role       | Font Family          | Usage                              |
|------------|----------------------|------------------------------------|
| **Heading** | `Plus Jakarta Sans`  | All `h1`–`h6`, page titles, cards  |
| **Body**    | `Inter`              | Paragraphs, labels, form inputs    |
| **Mono**    | `JetBrains Mono`     | Code editor, scores, technical IDs |

### Tailwind Classes

```
font-heading   → Plus Jakarta Sans
font-body      → Inter
font-mono      → JetBrains Mono
```

Fonts are loaded via Google Fonts in `index.html` (weights 400–700).

---

## Color Palette

All colors are defined as **HSL values** in CSS custom properties (`:root`) and consumed via Tailwind semantic tokens. No raw color classes are used in components.

### Core Tokens

| Token                    | HSL Value            | Hex (approx.) | Usage                        |
|--------------------------|----------------------|---------------|------------------------------|
| `--background`           | `240 6% 3.9%`       | `#09090b`     | Page background              |
| `--foreground`           | `0 0% 98%`          | `#fafafa`     | Primary text                 |
| `--card`                 | `240 5% 10%`        | `#18181b`     | Card / panel backgrounds     |
| `--card-foreground`      | `0 0% 98%`          | `#fafafa`     | Card text                    |
| `--primary`              | `217 91% 60%`       | `#3b82f6`     | Buttons, links, active items |
| `--primary-foreground`   | `0 0% 100%`         | `#ffffff`     | Text on primary              |
| `--secondary`            | `240 4% 16%`        | `#27272a`     | Secondary buttons, surfaces  |
| `--secondary-foreground` | `0 0% 98%`          | `#fafafa`     | Text on secondary            |
| `--muted`                | `240 4% 16%`        | `#27272a`     | Subtle backgrounds           |
| `--muted-foreground`     | `240 5% 65%`        | `#a1a1aa`     | Placeholder / helper text    |
| `--accent`               | `240 4% 16%`        | `#27272a`     | Hover states, sidebar active |
| `--accent-foreground`    | `0 0% 98%`          | `#fafafa`     | Text on accent               |
| `--destructive`          | `0 84% 60%`         | `#ef4444`     | Delete, reject, errors       |
| `--destructive-foreground` | `0 0% 98%`        | `#fafafa`     | Text on destructive          |
| `--success`              | `160 84% 39%`       | `#10b981`     | Passed, approved, success    |
| `--success-foreground`   | `0 0% 100%`         | `#ffffff`     | Text on success              |
| `--warning`              | `38 92% 50%`        | `#f59e0b`     | Pending, caution states      |
| `--warning-foreground`   | `0 0% 0%`           | `#000000`     | Text on warning              |
| `--border`               | `240 4% 16%`        | `#27272a`     | All borders                  |
| `--input`                | `240 4% 16%`        | `#27272a`     | Input field borders          |
| `--ring`                 | `217 91% 60%`       | `#3b82f6`     | Focus rings                  |

### Sidebar Tokens

| Token                           | HSL Value        | Usage                |
|---------------------------------|------------------|----------------------|
| `--sidebar-background`          | `240 6% 3.9%`   | Sidebar background   |
| `--sidebar-foreground`          | `240 5% 65%`    | Sidebar text         |
| `--sidebar-primary`             | `217 91% 60%`   | Active nav item      |
| `--sidebar-primary-foreground`  | `0 0% 100%`     | Active nav text      |
| `--sidebar-accent`              | `240 4% 16%`    | Hover state          |
| `--sidebar-accent-foreground`   | `0 0% 98%`      | Hover text           |
| `--sidebar-border`              | `240 4% 16%`    | Sidebar dividers     |

### Special Tokens

| Token                  | Value           | Usage            |
|------------------------|-----------------|------------------|
| `--editor-background`  | `0 0% 0%`      | Code editor bg   |
| `--radius`             | `0.5rem` (8px)  | Base border radius |

---

## Border Radius

Derived from `--radius: 0.5rem`:

| Class         | Value                          | Pixels |
|---------------|--------------------------------|--------|
| `rounded-lg`  | `var(--radius)` = `0.5rem`     | 8px    |
| `rounded-md`  | `calc(var(--radius) - 2px)`    | 6px    |
| `rounded-sm`  | `calc(var(--radius) - 4px)`    | 4px    |

---

## Animations & Motion

### Keyframes

| Name              | Effect                                     | Duration | Easing   |
|-------------------|----------------------------------------------|----------|----------|
| `fade-in`         | Opacity 0→1 + translateY(4px→0)              | 200ms    | ease-out |
| `accordion-down`  | Height 0 → content height                   | 200ms    | ease-out |
| `accordion-up`    | Height content → 0                           | 200ms    | ease-out |

### Usage

```html
<main className="animate-fade-in">  <!-- Page content entrance -->
```

### Transition Defaults

All interactive elements use Tailwind's `transition-colors` for hover/focus state changes. No spring physics or complex motion — the system favors **snappy, subtle transitions** for a professional feel.

---

## Spacing & Layout

| Element            | Value         | Notes                        |
|--------------------|---------------|------------------------------|
| Sidebar width      | `w-60` (240px)| Fixed left sidebar           |
| Header height      | `h-14` (56px) | Fixed top header             |
| Page padding       | `p-6` (24px)  | Main content area            |
| Container max      | `1400px`      | `2xl` breakpoint             |
| Container padding  | `2rem` (32px) | Horizontal padding           |
| Card gap           | `gap-4`–`gap-6` | Between grid items        |

---

## Component Library

Built on **shadcn/ui** (Radix primitives + Tailwind styling).

### Button Variants

| Variant       | Style                                       |
|---------------|---------------------------------------------|
| `default`     | `bg-primary text-primary-foreground`         |
| `destructive` | `bg-destructive text-destructive-foreground` |
| `outline`     | `border-input bg-background`                 |
| `secondary`   | `bg-secondary text-secondary-foreground`     |
| `ghost`       | Transparent, hover: `bg-accent`              |
| `link`        | `text-primary` with underline on hover       |

### Button Sizes

| Size      | Height | Padding    |
|-----------|--------|------------|
| `default` | 40px   | `px-4 py-2`|
| `sm`      | 36px   | `px-3`     |
| `lg`      | 44px   | `px-8`     |
| `icon`    | 40×40  | —          |

### Status Badges

Color-coded using semantic tokens:

| Status       | Color Token    | Example             |
|--------------|----------------|----------------------|
| Published    | `success`      | Green badge          |
| Pending      | `warning`      | Amber badge          |
| Rejected     | `destructive`  | Red badge            |
| Draft        | `secondary`    | Gray badge           |
| Shortlisted  | `primary`      | Blue badge           |

---

## Iconography

- **Library:** Lucide React (`lucide-react`)
- **Size:** Default `size-4` (16px) inside buttons, `size-5` (20px) in nav
- **Style:** Stroke-based, 2px stroke width, consistent with the minimal aesthetic

---

## Shadows & Depth

The design is predominantly **flat** with subtle depth cues:

- Cards use `bg-card` against `bg-background` for contrast (no box-shadow by default)
- Focus states use `ring-2 ring-ring ring-offset-2 ring-offset-background`
- Popover/dropdown menus inherit shadcn defaults with slight elevation

---

## Dark Mode

The entire app runs in **dark mode only** — there is no light theme toggle. All tokens in `:root` are dark-optimized. The `darkMode: ["class"]` config is present in Tailwind but unused; the base palette _is_ the dark theme.

---

## File Reference

| File                    | Purpose                          |
|-------------------------|----------------------------------|
| `src/index.css`         | CSS custom properties (tokens)   |
| `tailwind.config.ts`    | Tailwind theme extension         |
| `components.json`       | shadcn/ui configuration          |
| `index.html`            | Google Fonts imports             |
| `src/components/ui/*`   | shadcn/ui primitives             |
