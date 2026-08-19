<script setup lang="ts">
import {
  nextTick,
  ref,
  watch,
} from 'vue'

import {
  useCommandPalette,
} from '@/composables/useCommandPalette'

import CommandBreadcrumbs from '@/components/CommandBreadcrumbs.vue'
import CommandFooter from '@/components/CommandFooter.vue'
import CommandList from '@/components/CommandList.vue'

type CommandPalette =
  ReturnType<typeof useCommandPalette>

const props = defineProps<{
  palette: CommandPalette
}>()

const searchInput =
  ref<HTMLInputElement | null>(null)

/**
 * Whenever the palette opens,
 * automatically focus the search input.
 */
watch(
  () => props.palette.isOpen.value,
  async (isOpen) => {
    if (!isOpen) {
      return
    }

    await nextTick()

    searchInput.value?.focus()
  },
)

/**
 * Handle selecting a command from the list.
 *
 * We update the selected index first,
 * then let the composable handle execution
 * or entering a submenu.
 */
function selectCommand(index: number) {
  props.palette.selectedIndex.value =
    index

  props.palette.enter()
}

/**
 * Handle hovering over a command.
 *
 * This keeps mouse and keyboard selection
 * synchronized.
 */
function hoverCommand(index: number) {
  props.palette.selectedIndex.value =
    index
}
</script>

<template>
  <Teleport to="body">
    <Transition name="palette">
      <div
        v-if="palette.isOpen.value"
        class="palette-backdrop"
        @click.self="palette.close()"
      >
        <section
          class="palette"
          role="dialog"
          aria-modal="true"
          aria-label="Command palette"
        >
          <!-- Breadcrumb + Search -->
          <header class="palette-header">
            <CommandBreadcrumbs
              :breadcrumbs="
                palette.breadcrumbs.value
              "
            />

            <input
              ref="searchInput"
              v-model="palette.query.value"
              class="search-input"
              type="text"
              placeholder="Search commands..."
              autocomplete="off"
              spellcheck="false"
              role="combobox"
              aria-autocomplete="list"
              aria-controls="command-list"
            />
          </header>

          <!-- Command results -->
          <CommandList
            :commands="
              palette.filteredCommands.value
            "
            :selected-index="
              palette.selectedIndex.value
            "
            @select="selectCommand"
            @hover="hoverCommand"
          />

          <!-- Keyboard help -->
          <CommandFooter />
        </section>
      </div>
    </Transition>
  </Teleport>
</template>
