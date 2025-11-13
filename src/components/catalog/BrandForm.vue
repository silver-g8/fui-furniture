<template>
  <q-form ref="formRef" @submit.prevent="handleSubmit">
    <div class="row q-col-gutter-md">
      <div class="col-12 col-md-6">
        <q-input
          v-model="formState.name"
          :label="t('catalog.brands.fields.name')"
          :rules="[requiredRule]"
          :disable="loading"
          outlined
          dense
        />
      </div>

      <div class="col-12 col-md-6">
        <q-input
          v-model="formState.slug"
          :label="t('catalog.brands.fields.slug')"
          :disable="loading"
          outlined
          dense
          hint="Auto-generated if empty"
        />
      </div>

      <div class="col-12 col-md-6">
        <q-input
          v-model="formState.code"
          :label="t('catalog.brands.fields.code')"
          :rules="[requiredRule]"
          :disable="loading"
          outlined
          dense
        />
      </div>

      <div class="col-12 col-md-6">
        <q-input
          v-model="formState.websiteUrl"
          :label="t('catalog.brands.fields.websiteUrl')"
          :disable="loading"
          outlined
          dense
        />
      </div>

      <div class="col-12 col-md-6">
        <q-input
          v-model="formState.logoUrl"
          :label="t('catalog.brands.fields.logoUrl')"
          :disable="loading"
          outlined
          dense
        />
      </div>

      <div class="col-12 col-md-6">
        <q-toggle
          v-model="formState.isActive"
          :label="t('catalog.brands.fields.isActive')"
          :disable="loading"
        />
      </div>
    </div>

    <div class="row q-col-gutter-sm q-mt-lg">
      <div class="col-auto">
        <q-btn
          color="primary"
          :label="t('catalog.brands.actions.submit')"
          type="submit"
          :loading="loading"
        />
      </div>
      <div class="col-auto">
        <q-btn
          flat
          color="primary"
          :label="t('catalog.brands.actions.cancel')"
          :disable="loading"
          @click="emit('cancel')"
        />
      </div>
    </div>
  </q-form>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import type { QForm } from 'quasar';
import type { BrandPayload } from '@/services/catalog/brand.service';

const props = withDefaults(
  defineProps<{
    modelValue?: Partial<BrandPayload>;
    loading?: boolean;
  }>(),
  {
    modelValue: () => ({}),
    loading: false,
  },
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: BrandPayload): void;
  (e: 'submit', value: BrandPayload): void;
  (e: 'cancel'): void;
}>();

const { t } = useI18n();
const formRef = ref<QForm>();

const defaultState = (): BrandPayload => ({
  name: '',
  slug: '',
  code: '',
  websiteUrl: null,
  logoUrl: null,
  isActive: true,
});

const formState = reactive<BrandPayload>({
  ...defaultState(),
  ...props.modelValue,
});

const requiredRule = (value: unknown) => {
  if (value === null || value === undefined) {
    return t('catalog.validation.required');
  }

  if (typeof value === 'string') {
    return value.trim().length > 0 || t('catalog.validation.required');
  }

  if (typeof value === 'number') {
    return !Number.isNaN(value) || t('catalog.validation.required');
  }

  return true;
};

watch(
  () => props.modelValue,
  (incoming) => {
    if (!incoming) {
      Object.assign(formState, defaultState());
      return;
    }
    Object.assign(formState, {
      ...defaultState(),
      ...incoming,
    });
  },
  { deep: true, immediate: true },
);

watch(
  formState,
  () => {
    emit('update:modelValue', { ...formState });
  },
  { deep: true },
);

const handleSubmit = async () => {
  const form = formRef.value;
  if (!form) {
    return;
  }

  const valid = await form.validate();
  if (!valid) {
    return;
  }

  emit('submit', { ...formState });
};
</script>

