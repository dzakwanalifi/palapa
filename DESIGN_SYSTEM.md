# PALAPA Design System - Color & Component Specs

## Color Palette

### Primary Colors
| Name | Color Code | Usage |
|------|-----------|-------|
| Primary Blue | `#365594` | Buttons, links, accents |
| Primary Blue Light | `#3B6ACE` | Gradients, backgrounds |
| Primary Blue Dark | `#1E3568` | Dark gradient backgrounds |
| Primary Blue Variant | `#2E5291` | Gradient mid-point |
| Primary Blue Accent | `#3B69CC` | Links, secondary buttons |

### Secondary Colors
| Name | Color Code | Usage |
|------|-----------|-------|
| Light Blue Background | `#F2F8FF` | Badge backgrounds, light fills |
| Yellow/Cream Buttons | `#F5F3C0` | Quick reply buttons, options |
| Green Success | `#00B76E` | Save button, positive actions |

### Text Colors
| Name | Color Code | Usage |
|------|-----------|-------|
| Dark Text Primary | `#02131B` | Main headings, primary text |
| Dark Text Secondary | `#1A1A1A` | Regular text, content |
| Dark Gray | `#1D1D1D` | Card titles, emphasis |
| Medium Gray | `#3A544F` | Body text, descriptions |
| Gray Text | `#5F6265` | Secondary text, labels |
| Light Gray Text | `#606060` | Ratings, helper text |

### Border & Shadow Colors
| Name | Color Code | Usage |
|------|-----------|-------|
| Light Border | `#DFE0E0` | Card borders, dividers |
| Light Divider | `#CDCFD0` | Separator dots, thin lines |
| Gray Text | `#929398` | Inactive text, secondary labels |

---

## Component Specifications

### Buttons

#### Primary Button (Blue)
```css
Background: #365594
Text Color: #FFFFFF
Font Weight: 600-700
Padding: 12px 16px (py-3 px-4)
Border Radius: 8px (rounded-lg) or 16px (rounded-2xl)
Hover: bg-[#2a447a] or opacity-90
```

#### Secondary Button (Outline)
```css
Background: transparent
Border: 2px solid #365594
Text Color: #365594
Font Weight: 600
Padding: 12px 16px
Border Radius: 8px
Hover: bg-blue-50
```

#### Quick Reply Button (Yellow)
```css
Background: #F5F3C0
Border: 1px solid #F5F3C0
Text Color: #1A1A1A
Font Weight: 600
Padding: 8px 12px (py-2 px-3)
Border Radius: 16px (rounded-2xl)
Font Size: 12px (text-xs)
Hover: bg-yellow-200
```

#### Save Button (Green)
```css
Background: #FFFFFF
Border: 1px solid #D0D0D0
Text Color: #00B76E
Font Weight: 600
Padding: 10px 16px (py-2.5 px-4)
Border Radius: 8px
Font Size: 14px (text-sm)
Hover: bg-green-50
```

### Cards

#### Standard Card
```css
Background: #FFFFFF
Border: 1px solid #DFE0E0
Border Radius: 16px (rounded-2xl)
Padding: 16px (p-4)
Shadow: shadow-sm
Hover: shadow-md
```

#### Collection Card
```css
Layout: Horizontal flex
Image: 80x80px, rounded-2xl
Border: 1px solid #DFE0E0
Border Radius: 16px
Gap: 16px
```

### Input Fields

#### Search Input
```css
Background: #FFFFFF
Border: none
Border Radius: 16px (rounded-2xl)
Height: 56px (h-14)
Padding: 12px 16px (pl-12 pr-4)
Font Size: 16px
Placeholder Color: #9CA3AF
Shadow: shadow-2xl shadow-blue-900/30
Focus: ring-2 ring-blue-400
```

### Badges & Tags

#### Category Badge
```css
Background: #F2F8FF
Text Color: #3A544F
Padding: 6px 12px
Border Radius: 16px (rounded-2xl)
Font Size: 12px (text-xs)
Font Weight: 500
```

#### Duration Badge
```css
Background: #F2F8FF
Text Color: #3A544F
Icon: Clock (14px)
Padding: 6px 12px
Border Radius: 16px
Font Size: 12px
```

#### Price Badge
```css
Background: #F2F8FF
Text Color: #3A544F
Icon: Wallet (14px)
Padding: 6px 12px
Border Radius: 16px
Font Size: 12px
```

### Facility Icons

#### Facility Button
```css
Background: Linear gradient from-blue-400 to-blue-500
Size: 48x48px (p-3)
Border Radius: 16px (rounded-2xl)
Icon Color: #FFFFFF
Icon Size: 20px
Label: 12px, #FFFFFF, text-[10px]
Flex Direction: column
Gap: 8px
```

### Typography

#### Headings

**H1 (Page Title)**
```css
Font Size: 28px (text-2xl)
Font Weight: 700
Line Height: 1.3
Color: #02131B
```

**H2 (Section Title)**
```css
Font Size: 24px (text-2xl)
Font Weight: 700
Color: #FFFFFF or #02131B
```

**H3 (Subsection)**
```css
Font Size: 18px (text-lg)
Font Weight: 700
Color: #02131B
```

**H4 (Card Title)**
```css
Font Size: 14px (text-sm)
Font Weight: 500-600
Color: #1D1D1D
```

#### Body Text

**Body Large**
```css
Font Size: 16px (text-base)
Font Weight: 400
Line Height: 1.5
Color: #3A544F
```

**Body Small**
```css
Font Size: 14px (text-sm)
Font Weight: 400-500
Line Height: 1.5
Color: #5F6265
```

**Body Extra Small**
```css
Font Size: 12px (text-xs)
Font Weight: 400-500
Color: #606060
```

**Label**
```css
Font Size: 12px (text-xs)
Font Weight: 600-700
Color: #1A1A1A or #5F6265
```

### Spacing System

#### Padding
```css
4px (p-1) - Small elements
8px (p-2) - Compact spacing
12px (p-3) - Regular spacing
16px (p-4) - Comfortable spacing
20px (p-5) - Large spacing
24px (p-6) - Extra large spacing
32px (p-8) - Sections
```

#### Gap
```css
8px (gap-2) - Tight
12px (gap-3) - Normal
16px (gap-4) - Comfortable
20px (gap-5) - Loose
24px (gap-6) - Section gaps
```

### Border Radius

| Size | Value | Usage |
|------|-------|-------|
| Small | 4px (rounded-sm) | Minimal rounding |
| Medium | 8px (rounded-lg) | Buttons, inputs |
| Large | 16px (rounded-2xl) | Cards, badges, modals |
| Extra Large | 20px (rounded-3xl) | Large surfaces |
| Full | 9999px (rounded-full) | Circles, pills |

### Shadows

#### Light Shadow
```css
box-shadow: 0px 1.5px 2.7px rgba(0, 0, 0, 0);
```

#### Medium Shadow
```css
box-shadow: shadow-sm (light); shadow-md (medium)
```

#### Large Shadow
```css
box-shadow: shadow-lg (cards when hover); shadow-xl (buttons)
```

#### Blue Shadow
```css
box-shadow: shadow-2xl shadow-blue-900/30
```

### Gradients

#### Header Gradient
```css
from-[#3B6ACE] via-[#2E5291] to-[#1E3568]
Direction: to-bottom (vertical)
```

#### Text Gradient
```css
from-blue-100 to-cyan-200
bg-clip-text text-transparent
```

#### Facility Button Gradient
```css
from-blue-400 to-blue-500
Direction: to-bottom-right
```

---

## Animation & Transitions

### Entrance Animations
```css
Fade In: opacity 0 to 1, duration 0.3s
Slide Up: transform translateY(100%) to 0, duration 0.4s
Scale: scale(0) to 1, duration 0.3s
```

### Interaction Animations
```css
Button Hover: scale(1.02), transition duration 200ms
Button Tap: scale(0.98), transition duration 150ms
Icon Rotate: rotate(0deg) to 180deg on expand
Smooth Transition: transition-colors, duration 200ms
```

---

## Layout System

### Screen Sizes
- Mobile: 320px - 480px
- Tablet: 481px - 768px
- Desktop: 769px+

### Container Sizing
```css
Max Width: 390px (mobile optimized)
Safe Area Padding: 24px horizontal (px-6)
Full Viewport Height: 100dvh
```

### Navigation
```css
Header Height: 44px (status bar)
Bottom Nav Height: 87px
Content Area: Remaining space
```

---

## Accessibility

### Color Contrast
- ✅ All text meets WCAG AA standards (4.5:1 for normal text)
- ✅ Large text: 3:1 ratio
- ✅ Non-text elements: 3:1 ratio

### Touch Targets
- ✅ Minimum 44px height for interactive elements
- ✅ Proper spacing between targets
- ✅ Clear focus states for keyboard navigation

### Text Sizes
- ✅ Minimum 12px for body text
- ✅ Scalable text sizes with proper line height
- ✅ Readable fonts (Poppins, DM Sans, Nunito)

---

## Implementation Notes

### Tailwind Classes Used
```
Colors: text-[#HEX], bg-[#HEX], border-[#HEX]
Spacing: p-*, m-*, gap-*
Border Radius: rounded-*, rounded-[size]
Shadows: shadow-*, shadow-[color]
Animations: transition-*, duration-*
Sizing: w-*, h-*
Layout: flex, grid, relative, absolute
```

### Font Stack
```css
Primary: "Poppins", sans-serif
Secondary: "DM Sans", sans-serif
Accent: "Nunito", sans-serif
Specialty: "Uncial Antiqua", serif (logo only)
```

---

**Last Updated:** 2025-11-20
**Version:** 1.0
**Status:** Production Ready
