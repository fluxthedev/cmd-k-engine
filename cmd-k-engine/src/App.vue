<script setup lang="ts">
import CommandPalette from './components/CommandPallete.vue'
import { useCommandPalette } from './composables/useCommandPalette'

const palette = useCommandPalette()

palette.register({
  id: 'navigation',
  label: 'Navigation',
  description: 'Move around the application',
  keywords: [
    'navigate',
    'pages',
  ],
  children: [
    {
      id: 'navigation.dashboard',
      label: 'Dashboard',
      description: 'Open your dashboard',
      action: () => {
        window.alert(
          'Opening dashboard',
        )
      },
    },
    {
      id: 'navigation.projects',
      label: 'Projects',
      description: 'View projects',
      action: () => {
        window.alert(
          'Opening projects',
        )
      },
    },
  ],
})

palette.register({
  id: 'theme',
  label: 'Change Theme',
  description: 'Change appearance',
  keywords: [
    'dark',
    'light',
    'appearance',
  ],
  children: [
    {
      id: 'theme.light',
      label: 'Light Mode',
      action: () => {
        window.alert('Light mode')
      },
    },
    {
      id: 'theme.dark',
      label: 'Dark Mode',
      action: () => {
        window.alert('Dark mode')
      },
    },
  ],
})

palette.register({
  id: 'settings',
  label: 'Settings',
  description: 'Open application settings',
  keywords: [
    'preferences',
    'account',
  ],
  action: () => {
    window.alert('Opening settings')
  },
})

palette.register({
  id: 'help',
  label: 'Search Help',
  description: 'Search the documentation',
  keywords: [
    'docs',
    'documentation',
  ],
  action: () => {
    window.alert('Opening help')
  },
})
</script>

<template>
  <main class="app">
    <div class="hero">
      <p class="eyebrow">
        Vue 3 + TypeScript
      </p>

      <h1>
        Cmd+K Command Palette
      </h1>

      <p>
        Press
        <kbd>⌘ K</kbd>
        on Mac or
        <kbd>Ctrl K</kbd>
        on Windows/Linux.
      </p>

      <button
        type="button"
        @click="palette.open()"
      >
        Open Command Palette
      </button>
    </div>

    <CommandPalette
      :palette="palette"
    />
  </main>
</template>