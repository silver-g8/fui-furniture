<template>
  <div class="q-gutter-md">
    <q-input
      v-model="localForm.code"
      label="รหัสลูกค้า"
      dense
      outlined
      :disable="isEdit"
      :rules="[requiredRule]"
    />

    <q-input v-model="localForm.name" label="ชื่อลูกค้า" dense outlined :rules="[requiredRule]" />

    <q-input
      v-model="localForm.email"
      label="อีเมล"
      type="email"
      dense
      outlined
    />

    <q-input
      v-model="localForm.phone"
      label="เบอร์โทรศัพท์"
      dense
      outlined
      :rules="[requiredRule]"
    />

    <q-input
      v-model="localForm.tax_id"
      label="เลขประจำตัวผู้เสียภาษี"
      dense
      outlined
      hint="สำหรับองค์กร/บริษัท"
    />

    <q-input v-model="localForm.address" label="ที่อยู่" type="textarea" dense outlined autogrow />

    <q-input
      v-model="localForm.shipping_address"
      label="ที่อยู่จัดส่ง"
      type="textarea"
      dense
      outlined
      autogrow
      hint="ถ้าไม่ระบุจะใช้ที่อยู่หลัก"
    />

    <q-input
      v-model="localForm.billing_address"
      label="ที่อยู่ออกใบกำกับภาษี"
      type="textarea"
      dense
      outlined
      autogrow
      hint="ถ้าไม่ระบุจะใช้ที่อยู่หลัก"
    />

    <q-select
      v-model="localForm.payment_type"
      :options="paymentTypeOptions"
      emit-value
      map-options
      label="ประเภทชำระเงิน"
      dense
      outlined
      :rules="[requiredRule]"
    />

    <q-input
      v-if="localForm.payment_type === 'credit'"
      v-model.number="localForm.credit_limit"
      label="วงเงินเครดิต"
      type="number"
      dense
      outlined
      :rules="[creditRequiredRule]"
    />

    <q-input
      v-if="localForm.payment_type === 'credit'"
      v-model.number="localForm.credit_term_days"
      label="จำนวนวันเครดิต"
      type="number"
      dense
      outlined
      :rules="[creditRequiredRule]"
    />

    <q-input
      v-if="localForm.payment_type === 'credit'"
      v-model="localForm.credit_note"
      label="หมายเหตุเครดิต"
      type="textarea"
      dense
      outlined
      autogrow
    />

    <q-toggle v-model="localForm.is_active" label="สถานะใช้งาน" color="primary" />

    <div class="row justify-end q-gutter-sm q-mt-md">
      <q-btn flat color="primary" :label="cancelLabel" @click="$emit('cancel')" />
      <q-btn
        unelevated
        color="primary"
        :label="submitLabel"
        :loading="loading"
        @click="handleSubmit"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, watch } from 'vue';
import type { CustomerPayload } from '@/services/sales/api';

const props = defineProps<{
  modelValue: CustomerPayload;
  loading?: boolean;
  isEdit?: boolean;
  submitLabel?: string;
  cancelLabel?: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: CustomerPayload): void;
  (e: 'submit', value: CustomerPayload): void;
  (e: 'cancel'): void;
}>();

const localForm = reactive<CustomerPayload>({ ...props.modelValue });

watch(
  () => props.modelValue,
  (value) => {
    Object.assign(localForm, value);
  },
  { deep: true },
);

const paymentTypeOptions = [
  { label: 'เงินสด', value: 'cash' },
  { label: 'เครดิต', value: 'credit' },
];

const submitLabel = computed(
  () => props.submitLabel ?? (props.isEdit ? 'บันทึกการแก้ไข' : 'บันทึก'),
);
const cancelLabel = computed(() => props.cancelLabel ?? 'ยกเลิก');

const requiredRule = (val: unknown) => {
  if (val === null || val === undefined || val === '') {
    return 'กรุณากรอกข้อมูลให้ครบถ้วน';
  }
  return true;
};

const creditRequiredRule = (val: unknown) => {
  if (localForm.payment_type !== 'credit') {
    return true;
  }
  if (val === null || val === undefined || val === '') {
    return 'กรุณากรอกข้อมูลเครดิตให้ครบถ้วน';
  }
  return true;
};

const handleSubmit = () => {
  emit('update:modelValue', { ...localForm });
  emit('submit', { ...localForm });
};
</script>
