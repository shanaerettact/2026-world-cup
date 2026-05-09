<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import { useTheme } from '@/composables/useTheme'

useTheme()

const route = useRoute()
const standalone = computed(() => route.meta['standalone'] === true)
</script>

<template>
  <router-view v-if="standalone" />
  <DefaultLayout v-else />
</template>
