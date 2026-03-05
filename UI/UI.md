# HireFlow AI — UI Specification

> Complete reference for fonts, colors, layout, components, animations, and design tokens.

---

## 1. Fonts

| Role | Family | Weights | Usage |
|------|--------|---------|-------|
| **Headings** | `Space Grotesk` | 400, 500, 600, 700 | All `<h1>`–`<h6>`, logo text, page titles, card headings |
| **Body** | `Inter` | 300, 400, 500, 600, 700, 800 | Paragraphs, labels, inputs, buttons, table cells, captions |

### CSS Variables
```css
--font-heading: 'Space Grotesk', system-ui, sans-serif;
--font-body: 'Inter', system-ui, sans-serif;
```

### Loading
Fonts are loaded via Google Fonts in `index.html` with `preconnect` for performance:
```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
```

---

## 2. Color System

All colors use **HSL** values and are defined as CSS custom properties in `:root`. Tailwind consumes them via `hsl(var(--token))`.

### Core Palette

| Token | HSL Value | Hex (approx.) | Usage |
|-------|-----------|----------------|-------|
| `--background` | `220 20% 7%` | `#0f1217` | Page background |
| `--foreground` | `220 15% 90%` | `#dee1e6` | Primary text |
| `--card` | `220 20% 10%` | `#161b22` | Card / panel backgrounds |
| `--card-foreground` | `220 15% 90%` | `#dee1e6` | Card text |
| `--popover` | `220 20% 10%` | `#161b22` | Dropdown / popover backgrounds |
| `--popover-foreground` | `220 15% 90%` | `#dee1e6` | Popover text |

### Brand Colors

| Token | HSL Value | Hex (approx.) | Usage |
|-------|-----------|----------------|-------|
| `--primary` | `173 58% 39%` | `#2a9d8f` | Buttons, links, active states, accents |
| `--primary-foreground` | `0 0% 100%` | `#ffffff` | Text on primary backgrounds |
| `--accent` | `173 58% 39%` | `#2a9d8f` | Highlights, badges, rings |
| `--accent-foreground` | `0 0% 100%` | `#ffffff` | Text on accent backgrounds |
| `--ring` | `173 58% 39%` | `#2a9d8f` | Focus rings |

### Neutral / Surface Colors

| Token | HSL Value | Usage |
|-------|-----------|-------|
| `--secondary` | `220 18% 15%` | Secondary buttons, tags |
| `--secondary-foreground` | `220 15% 85%` | Text on secondary |
| `--muted` | `220 18% 15%` | Subtle backgrounds |
| `--muted-foreground` | `220 12% 50%` | Placeholder text, captions |
| `--border` | `220 18% 16%` | Borders, dividers |
| `--input` | `220 18% 16%` | Input field borders |

### Semantic / Status Colors

| Token | HSL Value | Usage |
|-------|-----------|-------|
| `--success` | `152 69% 40%` | Published, shortlisted, pass states |
| `--success-foreground` | `0 0% 100%` | Text on success |
| `--warning` | `38 92% 50%` | Draft, pending states |
| `--warning-foreground` | `0 0% 5%` | Text on warning |
| `--destructive` | `0 72% 51%` | Errors, rejected, closed states |
| `--destructive-foreground` | `0 0% 100%` | Text on destructive |

### Sidebar Colors

| Token | HSL Value | Usage |
|-------|-----------|-------|
| `--sidebar-background` | `220 22% 6%` | Sidebar base |
| `--sidebar-foreground` | `220 12% 55%` | Sidebar label text |
| `--sidebar-primary` | `173 58% 39%` | Active nav item |
| `--sidebar-primary-foreground` | `0 0% 100%` | Active nav text |
| `--sidebar-accent` | `220 18% 12%` | Hovered nav item background |
| `--sidebar-accent-foreground` | `220 15% 90%` | Hovered nav text |
| `--sidebar-border` | `220 18% 13%` | Sidebar borders |
| `--sidebar-ring` | `173 58% 39%` | Sidebar focus ring |

### Gradients

| Class | Definition | Usage |
|-------|-----------|-------|
| `.gradient-primary` | `linear-gradient(135deg, hsl(173 58% 39%), hsl(190 60% 45%))` | CTA buttons, logo badge |
| `.gradient-text` | Same gradient with `background-clip: text` | Hero text, feature highlights |

### Border Radius

```css
--radius: 0.625rem;  /* 10px */
/* Tailwind maps: lg = 10px, md = 8px, sm = 6px */
```

---

## 3. Layout Architecture

### 3.1 Overall Structure

```
┌─────────────────────────────────────────────────┐
│                   BrowserRouter                 │
│                                                 │
│  ┌─── Auth Pages (full-screen, no sidebar) ───┐ │
│  │  /login, /signup, /set-password            │ │
│  │  /onboarding/candidate, /onboarding/recruiter│
│  │  /aptitude/round/:jobId, /dsa/round/:jobId │ │
│  └────────────────────────────────────────────┘ │
│                                                 │
│  ┌─── DashboardLayout (sidebar + content) ────┐ │
│  │  /dashboard, /jobs, /jobs/new, /jobs/:id   │ │
│  │  /applications, /recruiter/scores, /profile│ │
│  └────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

### 3.2 DashboardLayout

```
┌──────────┬──────────────────────────────────────┐
│          │                                      │
│ Sidebar  │            Main Content              │
│ 250px    │         (flex-1, scrollable)          │
│ (fixed)  │                                      │
│          │   padding: p-6 to p-8                │
│ Collaps- │                                      │
│ ible to  │                                      │
│ 68px     │                                      │
│          │                                      │
└──────────┴──────────────────────────────────────┘
```

- **Sidebar**: Fixed left, full viewport height, `z-40`
- **Content area**: `ml-[250px]` offset, transitions on sidebar collapse
- **Minimum screen**: `min-h-screen` on outer wrapper

### 3.3 Sidebar Anatomy

```
┌─────────────────┐
│ ● HireFlow      │  ← Logo (gradient-primary icon + heading font)
│                  │     h-16, border-b
├─────────────────┤
│ ▸ Dashboard     │  ← Nav links (py-4, px-2)
│ ▸ Browse Jobs   │     Active: bg-primary/15, text-primary
│ ▸ Applications  │     Hover: bg-sidebar-accent
│ ▸ Profile       │     Icon: 18×18px, gap-3
├─────────────────┤
│ 👤 User Name    │  ← User section (border-t, p-3)
│    role          │     Avatar: 32px circle, primary/20
└─────────────────┘
│ ◀ Toggle        │  ← Collapse button (-right-3, absolute)
```

**Role-based navigation:**
- **Candidate**: Dashboard, Browse Jobs, Applications, Profile
- **Recruiter**: Dashboard, Post Job, Applications, Scores, Profile

### 3.4 Auth / Full-Screen Pages

These use a centered layout pattern:
```
┌─────────────────────────────────────────────────┐
│                                                 │
│           ┌──────────────────────┐              │
│           │     glass-card       │              │
│           │   max-w-md / max-w-2xl              │
│           │                      │              │
│           │   Form content       │              │
│           └──────────────────────┘              │
│                                                 │
│            min-h-screen flex items-center        │
│            justify-center bg-background          │
└─────────────────────────────────────────────────┘
```

### 3.5 Page Content Patterns

| Pattern | Structure | Used On |
|---------|-----------|---------|
| **Stats Grid** | `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4` | Dashboard |
| **Card Grid** | `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6` | Job Browse |
| **Table View** | Full-width `glass-card` with `<table>` inside | Applications, Scores |
| **Multi-step Wizard** | Stepper + single card, step content swaps | Job Creation, Onboarding |
| **Split Panel** | `grid grid-cols-1 lg:grid-cols-3` (2+1 or 1+2) | Job Details, DSA Round |

### 3.6 Spacing Scale

| Context | Value |
|---------|-------|
| Page padding | `p-6` to `p-8` |
| Card padding | `p-5` to `p-6` |
| Section gaps | `space-y-6` or `gap-6` |
| Inline element gap | `gap-2` to `gap-3` |
| Form field gap | `space-y-4` |

---

## 4. Component Library

Built on **shadcn/ui** + **Radix UI** primitives. All components use design tokens.

### 4.1 Glass Card (Custom)

```css
.glass-card {
  @apply bg-card/60 backdrop-blur-lg border border-border/60 rounded-xl shadow-lg shadow-black/10;
}
```

Used for: dashboard stat cards, form containers, content panels, modals.

### 4.2 Status Badges (Custom)

| Class | Background | Text | Border |
|-------|-----------|------|--------|
| `.status-published` | `success/15%` | `success` | `success/20%` |
| `.status-draft` | `warning/15%` | `warning` | `warning/20%` |
| `.status-closed` | `destructive/15%` | `destructive` | `destructive/20%` |
| `.status-pending` | `warning/15%` | `warning` | `warning/20%` |
| `.status-shortlisted` | `success/15%` | `success` | `success/20%` |
| `.status-rejected` | `destructive/15%` | `destructive` | `destructive/20%` |

### 4.3 shadcn/ui Components In Use

- **Layout**: Card, Separator, ScrollArea, Tabs, Accordion, Collapsible
- **Forms**: Input, Textarea, Select, Checkbox, RadioGroup, Switch, Slider, Label, Form (react-hook-form + zod)
- **Feedback**: Toast, Sonner, Alert, AlertDialog, Progress, Skeleton, Badge
- **Navigation**: NavigationMenu, Breadcrumb, Pagination, DropdownMenu, ContextMenu, Menubar
- **Overlay**: Dialog, Sheet, Drawer, Popover, HoverCard, Tooltip, Command
- **Data**: Table, Avatar, AspectRatio, Calendar
- **Interactive**: Button, Toggle, ToggleGroup, Carousel

### 4.4 Button Variants

| Variant | Style |
|---------|-------|
| `default` | `bg-primary text-primary-foreground` |
| `secondary` | `bg-secondary text-secondary-foreground` |
| `destructive` | `bg-destructive text-destructive-foreground` |
| `outline` | `border border-input bg-background` |
| `ghost` | Transparent, hover bg-accent |
| `link` | Underline, text-primary |
| Custom CTA | `.gradient-primary` applied manually |

---

## 5. Animations & Motion

### 5.1 CSS Keyframe Animations (index.css)

| Name | Effect | Duration |
|------|--------|----------|
| `fadeIn` | Opacity 0→1 | 0.3s ease-out |
| `slideUp` | Opacity 0→1 + translateY(16px→0) | 0.4s ease-out |
| `slideRight` | Opacity 0→1 + translateX(-16px→0) | 0.3s ease-out |

Utility classes: `.animate-fade-in`, `.animate-slide-up`, `.animate-slide-right`

### 5.2 Tailwind Keyframe Animations (tailwind.config.ts)

| Name | Effect | Duration |
|------|--------|----------|
| `accordion-down` | Height 0 → content height | 0.2s ease-out |
| `accordion-up` | Height content → 0 | 0.2s ease-out |

### 5.3 Transition Patterns

| Element | Property | Duration | Easing |
|---------|----------|----------|--------|
| Sidebar collapse | `width` | 300ms | default (ease) |
| Content margin | `margin-left` | 300ms | default |
| Nav link hover | `all` (bg, color) | default (150ms) | default |
| Collapse toggle | `colors` | default | default |
| Button hover | `colors` | default | default |

### 5.4 Interaction States

| Element | Hover | Active/Selected | Focus |
|---------|-------|-----------------|-------|
| Nav link | `bg-sidebar-accent`, `text-sidebar-accent-foreground` | `bg-primary/15`, `text-primary` | — |
| Button (default) | Slightly lighter primary | Pressed scale via browser default | `ring-2 ring-ring ring-offset-2` |
| Card | — (no hover by default) | — | — |
| Input | — | — | `ring-2 ring-ring` |
| Status badge | — | — | — |

---

## 6. Iconography

- **Library**: [Lucide React](https://lucide.dev) (`lucide-react`)
- **Default size**: `w-4 h-4` (16px) for inline, `w-5 h-5` (20px) for nav, `w-8 h-8` for feature
- **Color**: Inherits from parent `text-*` class
- **Stroke width**: Default (2px)

### Icons in Use

| Context | Icons |
|---------|-------|
| Sidebar nav | `LayoutDashboard`, `Briefcase`, `ClipboardList`, `Star`, `User` |
| Logo | `Sparkles` |
| UI controls | `ChevronLeft`, `ChevronRight`, `LogOut`, `Search`, `Filter`, `X` |
| Status | `CheckCircle`, `Clock`, `AlertTriangle`, `XCircle` |
| Assessment | `Code`, `Brain`, `Timer`, `Play` |

---

## 7. Typography Scale

| Element | Font | Size | Weight | Line Height |
|---------|------|------|--------|-------------|
| Page title (h1) | Space Grotesk | `text-2xl` (24px) | `font-bold` (700) | default |
| Section title (h2) | Space Grotesk | `text-xl` (20px) | `font-semibold` (600) | default |
| Card title (h3) | Space Grotesk | `text-lg` (18px) | `font-semibold` (600) | default |
| Body text | Inter | `text-sm` (14px) | `font-normal` (400) | default |
| Small/caption | Inter | `text-xs` (12px) | `font-medium` (500) | default |
| Button | Inter | `text-sm` (14px) | `font-medium` (500) | default |
| Nav label | Inter | `text-sm` (14px) | `font-medium` (500) | default |
| Input | Inter | `text-sm` (14px) | `font-normal` (400) | default |
| Logo | Space Grotesk | `text-lg` (18px) | `font-bold` (700) | tight |

---

## 8. Responsive Breakpoints

Using Tailwind defaults:

| Breakpoint | Width | Common Use |
|------------|-------|------------|
| `sm` | 640px | Stack → 2-col |
| `md` | 768px | 2-col grids, tablet |
| `lg` | 1024px | 3-col grids, sidebar visible |
| `xl` | 1280px | Max content width |
| `2xl` | 1400px | Container max-width |

**Container**: Centered, `padding: 2rem`, max `1400px`.

---

## 9. Dark Mode

The app is **dark-only** by design. There is no light mode toggle. All color tokens are defined for a single dark theme in `:root`. The `darkMode: ["class"]` config exists for shadcn compatibility but is not actively toggled.

---

## 10. File Map

| File | Purpose |
|------|---------|
| `src/index.css` | CSS variables, base styles, utility classes, keyframes |
| `tailwind.config.ts` | Tailwind theme extension, color mappings, animations |
| `index.html` | Font loading, meta tags |
| `src/components/ui/*` | shadcn/ui component primitives |
| `src/components/layout/Sidebar.tsx` | Collapsible sidebar navigation |
| `src/components/layout/DashboardLayout.tsx` | Sidebar + outlet wrapper |
| `src/contexts/AuthContext.tsx` | Role-based state (candidate/recruiter) |
| `src/App.tsx` | Route definitions and provider tree |

---

## 11. Route Map

| Route | Page | Layout | Role |
|-------|------|--------|------|
| `/login` | Login | Full-screen | — |
| `/signup` | Signup | Full-screen | — |
| `/set-password` | SetPassword | Full-screen | — |
| `/onboarding/candidate` | CandidateOnboarding | Full-screen | Candidate |
| `/onboarding/recruiter` | RecruiterOnboarding | Full-screen | Recruiter |
| `/dashboard` | Dashboard | DashboardLayout | Both |
| `/jobs` | JobBrowse | DashboardLayout | Candidate |
| `/jobs/new` | JobCreationWizard | DashboardLayout | Recruiter |
| `/jobs/:id` | JobDetails | DashboardLayout | Both |
| `/applications` | Applications | DashboardLayout | Both |
| `/recruiter/scores` | CandidateScores | DashboardLayout | Recruiter |
| `/profile` | Profile | DashboardLayout | Both |
| `/aptitude/round/:jobId` | AptitudeRound | Full-screen | Candidate |
| `/dsa/round/:jobId` | DSARound | Full-screen | Candidate |
