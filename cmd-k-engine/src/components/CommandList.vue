<script setup lang="ts">
import type { Command } from '@/types/command'

import CommandItem from '@/components/CommandItem.vue'

defineProps<{
  commands: Command[]
  selectedIndex: number
}>()

const emit = defineEmits<{
  select: [index: number]
  hover: [index: number]
}>()
</script>

<template>
  <div
    id="command-list"
    class="command-list"
    role="listbox"
    aria-label="Commands"
  >
    <div
      v-if="!commands.length"
      class="empty-state"
    >
      No commands found.
    </div>

    <CommandItem
      v-for="(
        command,
        index
      ) in commands"
      :key="command.id"
      :command="command"
      :active="selectedIndex === index"
      @mouseenter="emit('hover', index)"
      @select="emit('select', index)"
    />
  </div>
</template>
