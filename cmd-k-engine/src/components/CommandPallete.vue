<script setup lang="ts">
    import {
    nextTick,
    ref,
    watch,
    } from 'vue'

    import {
    useCommandPalette,
    } from '@/composables/useCommandPalette'

    type CommandPalette =
    ReturnType<typeof useCommandPalette>

    const props = defineProps<{
    palette: CommandPalette
    }>()

    const searchInput =
    ref<HTMLInputElement | null>(null)

    /**
     * Whenever the palette opens, automatically
     * put the user's cursor in the search box.
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
     * Handles keyboard events specifically from
     * the search input.
     *
     * Backspace has special behavior:
     * if the search is already empty, go back
     * one level in the menu hierarchy.
     */
    function handleInputKeydown(
    event: KeyboardEvent,
    ) {
    if (
        event.key === 'Backspace' &&
        !props.palette.query.value
    ) {
        event.preventDefault()

        props.palette.back()
    }
    }

    /**
     * Handles clicking a command.
     *
     * We update the selected index first so that
     * enter() knows which command was clicked.
     */
    function selectCommand(
    index: number,
        ) {
        props.palette.selectedIndex.value =
            index

        props.palette.enter()
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
          <!-- Search area -->
          <header class="palette-header">
            <div class="breadcrumbs">
              <span>Commands</span>

              <template
                v-for="breadcrumb in palette.breadcrumbs.value"
                :key="breadcrumb"
              >
                <span aria-hidden="true">
                  /
                </span>

                <span>
                  {{ breadcrumb }}
                </span>
              </template>
            </div>

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
              @keydown="handleInputKeydown"
            />
          </header>

          <!-- Command results -->
          <div
            id="command-list"
            class="command-list"
            role="listbox"
            aria-label="Commands"
          >
            <div
              v-if="
                !palette.filteredCommands.value.length
              "
              class="empty-state"
            >
              No commands found.
            </div>

            <button
              v-for="(
                command,
                index
              ) in palette.filteredCommands.value"
              :key="command.id"
              type="button"
              class="command"
              :class="{
                active:
                  palette.selectedIndex.value ===
                  index,
              }"
              role="option"
              :aria-selected="
                palette.selectedIndex.value ===
                index
              "
              @mouseenter="
                palette.selectedIndex.value =
                  index
              "
              @click="
                selectCommand(index)
              "
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

              <!-- Show an arrow if this command
                   opens a submenu. -->
              <span
                v-if="command.children?.length"
                class="arrow"
                aria-hidden="true"
              >
                →
              </span>
            </button>
          </div>

          <!-- Keyboard help -->
          <footer class="palette-footer">
            <span>↑ ↓ Navigate</span>
            <span>Enter Select</span>
            <span>Esc Close</span>
            <span>⌫ Back</span>
          </footer>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>