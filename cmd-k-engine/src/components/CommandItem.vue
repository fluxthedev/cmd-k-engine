<script setup lang="ts">
import type { Command } from '@/types/command'

defineProps<{
  command: Command
  active: boolean
}>()

const emit = defineEmits<{
  select: []
  hover: []
}>()
</script>

<template>
  <button
    type="button"
    class="command"
    :class="{ active }"
    role="option"
    :aria-selected="active"
    @mouseenter="emit('hover')"
    @click="emit('select')"
  >
    <span class="command-content">
      <strong>
        {{ command.label }}
      </strong>

      <small
        v-if="command.description"
      >
        {{ command.description }}
      </small>
    </span>

    <!-- Indicates that this command
         opens a submenu. -->
    <span
      v-if="command.children?.length"
      class="arrow"
      aria-hidden="true"
    >
      →
    </span>
  </button>
</template>
