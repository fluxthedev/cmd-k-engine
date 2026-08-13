import {
    computed,
    onMounted,
    onUnmounted,
    ref,
    watch
} from 'vue';

import type { Command } from '@/types/command';

// Allows the user to search for commands even if the letters aren't next to each other
// e.g. Search: acct -> Command: Account Settings
function fuzzyMatch(
  query: string,
  text: string,
): boolean {
  if (!query) {
    return true
  }

  const normalizedQuery =
    query.toLowerCase()

  const normalizedText =
    text.toLowerCase()

  let queryIndex = 0

  for (
    let i = 0;
    i < normalizedText.length;
    i++
  ) {
    if (
      normalizedText[i] ===
      normalizedQuery[queryIndex]
    ) {
      queryIndex++

      if (
        queryIndex ===
        normalizedQuery.length
      ) {
        return true
      }
    }
  }

  return false
}
