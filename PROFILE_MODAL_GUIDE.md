# Profile Modal - Visual Guide

## Desktop View

```
┌─────────────────────────────────────────────────────────────┐
│ 📋 Task Management          [Dashboard] [Tasks] [Time]      │
│ user@example.com               ┌──────┐  [+ Task] [Logout]  │
│                                │  JD  │ ← Profile Button    │
└────────────────────────────────└──────┘──────────────────────┘
                                    ↓ Click
                    ┌──────────────────────────────┐
                    │ ╔════════════════════════╗ │
                    │ ║  [JD]  My Profile    ✕ ║ │ ← Gradient Header
                    │ ║  user@example.com      ║ │
                    │ ╚════════════════════════╝ │
                    │ ┌─────────────────────────┐│
                    │ │ Profile Information     ││
                    │ │                         ││
                    │ │ Email: user@example.com ││
                    │ │ Name:  John Doe         ││
                    │ │ Mobile: +1234567890     ││
                    │ │                         ││
                    │ │  [Edit Profile]         ││
                    │ └─────────────────────────┘│
                    └──────────────────────────────┘
                              ↑
                        Modal with blur
                        backdrop overlay
```

## Mobile View (Bottom Sheet)

```
┌────────────────────────┐
│ 📋 Task Management     │
│ [Dashboard][Time]      │
│ [JD] [Logout]          │ ← Profile Button
└────────────────────────┘
          ↓ Click
┌────────────────────────┐
│                        │
│   Background Content   │
│   (Blurred + Dimmed)   │
│                        │
├────────────────────────┤ ← Rounded Top
│╔══════════════════════╗│
│║ [JD] My Profile    ✕ ║│ Gradient
│║ user@example.com     ║│ Header
│╚══════════════════════╝│
│┌──────────────────────┐│
││ Profile Information  ││
││                      ││
││ Email: user@...      ││
││ Name:  John Doe      ││
││ Mobile: +123...      ││
││                      ││
││   [Edit Profile]     ││
│└──────────────────────┘│
└────────────────────────┘
```

## Edit Mode

```
┌──────────────────────────────┐
│ ╔════════════════════════╗ │
│ ║  [JD]  My Profile    ✕ ║ │
│ ║  user@example.com      ║ │
│ ╚════════════════════════╝ │
│ ┌─────────────────────────┐│
│ │ Profile Information     ││
│ │                         ││
│ │ Full Name              *││
│ │ ┌─────────────────────┐ ││
│ │ │ John Doe            │ ││
│ │ └─────────────────────┘ ││
│ │                         ││
│ │ Mobile Number           ││
│ │ ┌─────────────────────┐ ││
│ │ │ 1234567890          │ ││
│ │ └─────────────────────┘ ││
│ │                         ││
│ │ ┌─────────┐ ┌────────┐ ││
│ │ │  Save   │ │ Cancel │ ││
│ │ └─────────┘ └────────┘ ││
│ └─────────────────────────┘│
└──────────────────────────────┘
```

## Success State

```
┌──────────────────────────────┐
│ ╔════════════════════════╗ │
│ ║  [JD]  My Profile    ✕ ║ │
│ ╚════════════════════════╝ │
│ ┌─────────────────────────┐│
│ │ ✓ Profile updated!      ││ ← Green Alert
│ │                         ││   (Auto-dismiss 3s)
│ │ Profile Information     ││
│ │                         ││
│ │ Email: user@example.com ││
│ │ Name:  John Doe         ││
│ │ Mobile: +1234567890     ││
│ │                         ││
│ │  [Edit Profile]         ││
│ └─────────────────────────┘│
└──────────────────────────────┘
```

## Color Scheme

### Gradient Header
```
Background: Linear gradient
  From: #667eea (Purple-blue)
  To:   #764ba2 (Deep purple)
```

### Avatar
```
Background: Same gradient
Border: rgba(255,255,255,0.3)
Size: 56px (modal) / 44px (navbar)
```

### Buttons
```
Primary (Save):
  Gradient: #667eea → #764ba2
  Hover: Lift -2px + Shadow

Secondary (Cancel):
  Background: #f0f0f0
  Hover: #e8e8e8

Profile Button:
  Background: Translucent gradient
  Border: rgba(79,134,255,0.3)
  Hover: Lift + Glow
```

### Alerts
```
Success:
  Background: #d4edda
  Color: #155724
  Border: #c3e6cb

Error:
  Background: #f8d7da
  Color: #721c24
  Border: #f5c6cb
```

## Animation Timeline

```
0ms   ─────> User clicks profile button
          │
          ├─> dispatch(openProfileModal())
          │
50ms  ────┤
          │
          ├─> Overlay starts fade-in (0.2s)
          │
200ms ────┤   Overlay fully visible
          │
          ├─> Modal starts slide-up (0.3s)
          │   cubic-bezier(0.16, 1, 0.3, 1)
          │
500ms ────┤   Animation complete
          │
          └─> User can interact
```

## Interaction Points

### Click Areas
```
┌──────────────────────────────┐
│ ╔════════════════════════╗ │
│ ║  [JD]  My Profile  [✕] ║ │ ← Close button
│ ╚════════════════════════╝ │
│ ┌─────────────────────────┐│
│ │ Content                 ││
│ └─────────────────────────┘│
└──────────────────────────────┘
 ↑
 Click outside (backdrop)
 closes modal
```

### Keyboard Shortcuts
- **ESC** - Close modal
- **Tab** - Navigate fields
- **Enter** - Submit form (when focused)

## Responsive Breakpoints

```
Desktop (> 768px)
  Modal: Centered, 600px max-width
  Avatar: 44px navbar / 56px modal
  Animation: Slide-up from center

Tablet (481-768px)
  Modal: Centered, 90% width
  Avatar: 40px navbar / 52px modal
  Animation: Slide-up from center

Mobile (≤ 480px)
  Modal: Bottom sheet, 100% width
  Avatar: 38px navbar / 48px modal
  Animation: Slide-up from bottom
  Rounded: Top corners only
```

## State Visual Indicators

### Loading State
```
[Save Changes...]
  ↑
  Spinner or pulse animation
  Buttons disabled
```

### Success State
```
✓ Profile updated successfully!
  ↑
  Green background
  Slide-down animation
  Auto-dismiss after 3s
```

### Error State
```
✗ Failed to update profile
  ↑
  Red background
  Shake animation
  Auto-dismiss after 5s
```

## Z-Index Hierarchy

```
Layer 10: Modals (9999)
Layer 9:  Dropdowns (1000)
Layer 8:  Tooltips (999)
...
Layer 2:  Header (100)
Layer 1:  Main Content (1)
Layer 0:  Background (0)
```

---

**Legend:**
- `╔═══╗` = Gradient section
- `┌───┐` = White/light section
- `[X]` = Button/interactive element
- `*` = Required field marker
- `✓` = Success indicator
- `✗` = Error indicator
