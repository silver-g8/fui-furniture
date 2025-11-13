<template>
  <q-page class="column q-pa-xl q-gutter-md" data-testid="menu-placeholder">
    <div class="text-h5 text-weight-bold">
      {{ $t('menu.placeholder.title') }}
    </div>

    <div class="text-body1">
      {{ $t('menu.placeholder.currentRoute') }}:
      <code class="bg-grey-2 q-pa-xs rounded-borders">{{ currentRoute.path }}</code>
    </div>

    <div v-if="breadcrumbs.length" class="column q-gutter-xs">
      <div class="text-subtitle1 text-weight-medium">
        {{ $t('menu.placeholder.breadcrumb') }}:
      </div>
      <div class="row items-center q-gutter-sm" data-testid="menu-placeholder-breadcrumb">
        <q-breadcrumbs class="text-body2">
          <q-breadcrumbs-el
            v-for="crumb in breadcrumbs"
            :key="crumb.id"
            :label="$t(crumb.label)"
          />
        </q-breadcrumbs>
      </div>
    </div>

    <q-banner dense class="bg-grey-2 text-grey-8">
      {{ $t('menu.placeholder.description') }}
    </q-banner>
  </q-page>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useMenu } from '@/composables/useMenu';
import { menuStructure } from '@/config/menu';

const route = useRoute();
const { getBreadcrumbs } = useMenu(menuStructure);

const currentRoute = computed(() => route);
const breadcrumbs = computed(() => getBreadcrumbs(route.path));
</script>

