# Calculator Position Fix

## Issue
When making the window smaller, the calculator was going under the AI Agent Chat on the right side of the screen, causing overlap and poor user experience.

## Solution
Moved the calculator from the **right bottom** to the **left bottom** side of the site to prevent conflicts with the AI Chat component.

## Changes Made

### File: `src/SwissStartupConnect.css`

#### 1. Main Calculator Position (Line 1981-1994)
**Before:**
```css
.ssc__calculator-anchor {
  position: fixed;
  right: clamp(1.25rem, 4vw, 3rem);
  bottom: clamp(7rem, 12vh, 10rem);
  align-items: flex-end;
  /* ... */
}
```

**After:**
```css
.ssc__calculator-anchor {
  position: fixed;
  left: clamp(1.25rem, 4vw, 3rem);  /* Changed from right to left */
  bottom: clamp(1.5rem, 4vh, 3rem);  /* Lowered position */
  align-items: flex-start;            /* Changed from flex-end to flex-start */
  /* ... */
}
```

#### 2. Mobile Responsive Styles (768px and below)
Added responsive positioning for tablets and mobile devices:
```css
@media (max-width: 768px) {
  .ssc__calculator-anchor {
    left: 1rem;
    bottom: 1rem;
  }

  .ssc__calculator-panel {
    width: calc(100vw - 2rem);
    max-width: 340px;
  }
}
```

#### 3. Small Screen Responsive Styles (480px and below)
Added positioning for small mobile screens:
```css
@media (max-width: 480px) {
  .ssc__calculator-anchor {
    left: 0.75rem;
    bottom: 0.75rem;
  }

  .ssc__calculator-toggle {
    width: 52px;  /* Slightly smaller button */
    height: 52px;
  }
}
```

## Layout Before & After

### Before:
```
┌─────────────────────────────────┐
│                                 │
│                                 │
│                          [Chat] │
│                        [Calc]   │  ← Overlap!
└─────────────────────────────────┘
```

### After:
```
┌─────────────────────────────────┐
│                                 │
│                                 │
│ [Calc]                  [Chat]  │  ← No overlap!
│                                 │
└─────────────────────────────────┘
```

## Benefits

✅ **No Overlap**: Calculator and AI Chat no longer conflict  
✅ **Better UX**: Both widgets are easily accessible  
✅ **Mobile Friendly**: Responsive design for all screen sizes  
✅ **Left-aligned**: More natural position for Western users  
✅ **Lower Position**: Calculator is now at the true bottom of the page

## Component Positions

### AI Chat
- **Position**: Fixed, right bottom
- **Desktop**: `right: 24px`, `bottom: 24px`
- **Mobile**: Full width at bottom
- **Z-index**: 1001

### Calculator
- **Position**: Fixed, left bottom
- **Desktop**: `left: clamp(1.25rem, 4vw, 3rem)`, `bottom: clamp(1.5rem, 4vh, 3rem)`
- **Tablet (768px)**: `left: 1rem`, `bottom: 1rem`
- **Mobile (480px)**: `left: 0.75rem`, `bottom: 0.75rem`
- **Z-index**: 18

## Testing Checklist

- [x] Calculator appears on left side on desktop
- [x] Calculator doesn't overlap with AI Chat
- [x] Responsive on tablet (768px)
- [x] Responsive on mobile (480px)
- [x] Calculator panel opens correctly on left
- [x] No linting errors
- [x] Calculator toggle button is properly aligned

## Browser Compatibility

The CSS uses modern features but with fallbacks:
- `clamp()` - Supported in all modern browsers
- `position: fixed` - Universal support
- Flexbox - Universal support
- Media queries - Universal support

## Notes

The calculator is now positioned on the **left side** to provide:
1. Clear separation from the AI Chat (right side)
2. Better mobile experience (no overlap)
3. More balanced layout
4. Easy access to both tools simultaneously

The positioning uses `clamp()` for responsive sizing that adapts smoothly across all screen sizes.

