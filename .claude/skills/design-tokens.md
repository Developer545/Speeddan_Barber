# Design Token System — Speeddan Barbería

## The Golden Rule
**NEVER hardcode a color.** Every color in every component MUST reference a CSS variable.
❌ BAD: `className="bg-[#C0302D]"` or `style={{ color: '#3E2614' }}`
✅ GOOD: `className="bg-brand"` or `style={{ color: 'hsl(var(--text-primary))' }}`

## 3-Layer Architecture (globals.css)

### Layer 1 — Raw Palette (palette tokens)
Defined once in `:root`. NEVER use these directly in components.
```css
--palette-crimson: 358 64% 46%;       /* #C0302D  intense red */
--palette-espresso: 22 52% 17%;       /* #3E2614  dark brown */
--palette-moss: 82 20% 22%;           /* #374521  olive green */
--palette-steel: 200 12% 70%;         /* #A8B8C0  blue-gray */
--palette-snow: 0 0% 98%;             /* #FAFAFA  soft white */
```

### Layer 2 — Semantic Tokens (purpose, not color)
These are the ONLY tokens to use in components:
```css
/* Backgrounds */
--bg-page, --bg-surface, --bg-subtle, --bg-muted, --bg-inverse

/* Text */
--text-primary, --text-secondary, --text-muted, --text-disabled, --text-inverse, --text-brand

/* Brand (changes per tenant) */
--brand-primary, --brand-primary-dark, --brand-primary-light
--brand-secondary, --brand-accent

/* Buttons */
--btn-primary-bg, --btn-primary-bg-hover, --btn-primary-fg
--btn-secondary-bg, --btn-secondary-bg-hover, --btn-secondary-fg

/* Borders */
--border-default, --border-strong, --border-brand, --border-focus

/* Status */
--status-success, --status-warning, --status-error, --status-info (+ -bg variants)

/* Sidebar */
--sidebar-bg, --sidebar-fg, --sidebar-fg-muted, --sidebar-item-hover, --sidebar-item-active
```

### Layer 3 — Per-Tenant Overrides
```css
/* Applied via data attribute on <body> or layout root */
[data-tenant="mi-barberia"] {
  --brand-primary: 213 94% 47%;   /* blue instead of red */
  --sidebar-bg: 220 14% 10%;
}
```
Tenant overrides are stored as JSON in `themeConfig` column and injected as `<style>` tag.

## Tailwind v4 Usage
The `@theme inline` block in globals.css exposes tokens as Tailwind utilities:
```
--color-bg-page → bg-bg-page
--color-text-primary → text-text-primary
--color-brand → bg-brand, text-brand
--color-border → border-border
```

**Use in components:**
```tsx
<div className="bg-bg-surface border border-border rounded-lg p-4">
  <h2 className="text-text-primary font-semibold">Title</h2>
  <p className="text-text-secondary text-sm">Description</p>
  <button className="bg-brand hover:bg-brand-dark text-text-inverse px-4 py-2 rounded">
    Action
  </button>
</div>
```

## Adding Tenant Theme at Runtime
```tsx
// In tenant layout:
const themeStyle = Object.entries(tenant.themeConfig as Record<string,string>)
  .map(([k, v]) => `${k}: ${v};`)
  .join('\n');

return (
  <>
    {themeStyle && <style>{`:root { ${themeStyle} }`}</style>}
    {children}
  </>
);
```

## Status Colors
```tsx
// Always use semantic status tokens:
<span className="text-[hsl(var(--status-success))] bg-[hsl(var(--status-success-bg))]">
  Confirmada
</span>
```

## Changing the Entire Palette
To change the palette project-wide, update ONLY Layer 1 in globals.css.
All semantic tokens and components update automatically — zero component changes needed.
