<script setup lang="ts">
defineProps<{
  breadcrumbs: string[]
}>()
</script>

<template>
  <div class="breadcrumbs">
    <span>Commands</span>

    <template
      v-for="breadcrumb in breadcrumbs"
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
</template>