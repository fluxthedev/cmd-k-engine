# Cmd+K Command Palette

A production-minded command palette engine built with **Vue 3 and TypeScript**, designed to demonstrate modern frontend architecture, reactive state management, keyboard-first interaction, accessibility, and component-driven UI design.

**Live Demo:** https://fluxthedev.github.io/cmd-k-engine/

**Repository:** https://github.com/fluxthedev/cmd-k-engine

---

## Overview

This project is a lightweight, reusable **Cmd+K / Ctrl+K command palette** built from scratch with Vue 3's Composition API.

The goal was to build something small enough to develop quickly while still demonstrating production-level frontend engineering principles:

- Clear separation of state and presentation
- Strong TypeScript typing
- Reactive state management
- Composable application logic
- Keyboard-first interaction
- Nested command navigation
- Fuzzy search
- Accessibility considerations
- Reusable Vue components
- Production deployment with GitHub Pages

The command palette can serve as a foundation for application-wide actions such as navigation, settings, search, developer tools, or contextual workflows.

---

## Features

### ⌨️ Keyboard First

| Shortcut | Action |
|---|---|
| `Cmd + K` | Open / close palette on macOS |
| `Ctrl + K` | Open / close palette on Windows/Linux |
| `↑ / ↓` | Navigate commands |
| `Enter` | Execute command / enter submenu |
| `Backspace` | Navigate to parent menu |
| `Escape` | Close palette |

### 🔎 Fuzzy Search

Commands can be searched using:

- Direct substring matching
- Simple fuzzy/subsequence matching
- Command labels
- Descriptions
- Keywords

Search fields are evaluated independently to prevent unrelated fields from being combined into accidental matches.

### 🌳 Nested Commands

Commands can contain child commands, allowing the palette to behave like a navigable command hierarchy.

```text
Commands
└── Navigation
    ├── Dashboard
    └── Projects
```

Breadcrumbs communicate the user's current location:

```text
Commands / Navigation
```

Backspace navigates up through the command hierarchy without closing the palette.

### 🧩 Dynamic Command Registration

Commands can be registered and unregistered dynamically through the command palette composable.

```ts
palette.register({
  id: 'settings',
  label: 'Settings',
  description: 'Open application settings',
  action: () => {
    // ...
  },
})
```

---

## Architecture

The project intentionally separates **application behavior from presentation**.

```text
useCommandPalette()
        │
        │ State + behavior
        ▼
CommandPalette.vue
        │
        ├── CommandBreadcrumbs.vue
        │
        ├── CommandList.vue
        │       │
        │       └── CommandItem.vue
        │
        └── CommandFooter.vue
```

### State Management

The command palette uses Vue's Composition API rather than introducing a global state library.

The composable owns the primary state:

```ts
isOpen
query
commands
selectedIndex
menuStack
```

Derived state is calculated with `computed()`:

```ts
currentCommands
filteredCommands
selectedCommand
breadcrumbs
```

User interactions are handled through explicit actions:

```ts
open()
close()
toggle()
moveUp()
moveDown()
enter()
back()
register()
unregister()
```

This creates a predictable unidirectional flow between state, components, and user interaction.

---

## Project Structure

```text
src/
├── components/
│   ├── CommandPalette.vue
│   ├── CommandBreadcrumbs.vue
│   ├── CommandList.vue
│   ├── CommandItem.vue
│   └── CommandFooter.vue
│
├── composables/
│   └── useCommandPalette.ts
│
├── types/
│   └── command.ts
│
├── App.vue
├── main.ts
└── styling.css
```

---

## Accessibility

The palette is designed with keyboard accessibility in mind.

It includes semantic ARIA roles including:

```html
role="dialog"
role="combobox"
role="listbox"
role="option"
```

Additional considerations include:

- Keyboard-only navigation
- Visible active command state
- Programmatic search input focus
- `aria-selected` state
- Escape-to-close behavior
- No mouse requirement for core functionality

---

## Tech Stack

- **Vue 3**
- **TypeScript**
- **Vite**
- **Vue Router**
- **VueUse**
- **Vitest**
- **ESLint**
- **GitHub Actions**
- **GitHub Pages**

---

## Getting Started

### Prerequisites

- Node.js 20+
- npm

### Installation

```bash
git clone https://github.com/fluxthedev/cmd-k-engine.git
cd cmd-k-engine/cmd-k-engine
npm install
npm run dev
```

For GitHub Codespaces:

```bash
npm run dev -- --host 0.0.0.0
```

---

## Production Build

```bash
npm run build
npm run preview
```

---

## Deployment

The application is deployed to **GitHub Pages** using GitHub Actions.

**Live application:** https://fluxthedev.github.io/cmd-k-engine/

---

## Design Decisions

### Why a composable instead of Pinia?

The command palette's state is scoped to this feature and does not need to be shared throughout the entire application.

A dedicated composable provides:

- Encapsulation
- Reusability
- Testability
- Less global state
- A simpler dependency model

Introducing a global state library would add unnecessary complexity for the current scope.

### Why separate state from components?

The command palette's behavior is independent from its visual representation.

Keeping that behavior inside `useCommandPalette()` means the UI can change without rewriting the underlying command registration, navigation, search, or keyboard logic.

### Why simple fuzzy matching?

The goal is to provide useful command discovery without introducing a large third-party search dependency.

The implementation prioritizes:

1. Exact substring matches
2. Fuzzy subsequence matches
3. Independent matching against labels, descriptions, and keywords

This keeps the implementation easy to understand and extend.

---

## Future Improvements

Potential next steps include:

- More sophisticated fuzzy-search scoring
- Recent command history
- Command ranking
- Command aliases
- Global focus trapping
- Screen-reader announcements
- Command groups
- Custom keyboard shortcut configuration
- Async command registration
- Lazy-loaded command groups
- Theme customization
- Automated accessibility testing
- Unit and component test coverage

---

## Why I Built This

This project was created as a demonstration of **senior-level frontend engineering practices using Vue 3 and TypeScript**.

Rather than relying on an existing command palette library, I implemented the core functionality from scratch to explore the engineering decisions involved in building a reusable keyboard-driven interface.

The focus is on **architecture, maintainability, accessibility, and user experience**, rather than simply reproducing the visual appearance of a command palette.

---

## License

This project is available for educational and portfolio purposes.
