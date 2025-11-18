<template>
  <q-dialog :model-value="modelValue" @update:model-value="(val) => $emit('update:modelValue', val)" persistent>
    <q-card style="min-width: 500px; max-width: 700px">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">ขอใบสั่งติดตั้ง</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup @click="handleClose" />
      </q-card-section>

      <q-card-section>
        <q-form @submit="handleSubmit" ref="formRef">
          <div class="q-gutter-md">
            <!-- Installation Date -->
            <q-input
              v-model="formData.installation_date"
              label="วันที่ติดตั้ง *"
              type="datetime-local"
              outlined
              dense
              :rules="[
                (val) => !!val || 'กรุณาระบุวันที่ติดตั้ง',
                (val) => {
                  if (val) {
                    const date = new Date(val);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    return date >= today || 'วันที่ติดตั้งต้องเป็นวันนี้หรือวันข้างหน้า';
                  }
                  return true;
                },
              ]"
            />

            <!-- Address Type Selection -->
            <q-option-group
              v-model="addressType"
              :options="addressTypeOptions"
              color="primary"
              inline
            />

            <!-- Installation Address (Dropdown) -->
            <q-select
              v-if="addressType === 'existing'"
              v-model="formData.installation_address_id"
              label="ที่อยู่ติดตั้ง"
              :options="addressOptions"
              option-label="address"
              option-value="id"
              emit-value
              map-options
              outlined
              dense
              clearable
              :rules="[
                (val) => {
                  if (addressType === 'existing') {
                    return !!val || 'กรุณาเลือกที่อยู่ติดตั้ง';
                  }
                  return true;
                },
              ]"
            >
              <template #no-option>
                <q-item>
                  <q-item-section class="text-grey">
                    ไม่พบที่อยู่ที่บันทึกไว้
                  </q-item-section>
                </q-item>
              </template>
            </q-select>

            <!-- Installation Address Override (Textarea) -->
            <q-input
              v-if="addressType === 'custom'"
              v-model="formData.installation_address_override"
              label="ที่อยู่ติดตั้ง (กำหนดเอง) *"
              type="textarea"
              rows="3"
              outlined
              dense
              :rules="[
                (val) => {
                  if (addressType === 'custom') {
                    return !!val || 'กรุณาระบุที่อยู่ติดตั้ง';
                  }
                  return true;
                },
              ]"
            />

            <!-- Contact Name -->
            <q-input
              v-model="formData.installation_contact_name"
              label="ชื่อผู้ติดต่อ"
              outlined
              dense
              maxlength="255"
            />

            <!-- Contact Phone -->
            <q-input
              v-model="formData.installation_contact_phone"
              label="เบอร์โทรศัพท์ติดต่อ"
              outlined
              dense
              maxlength="20"
              :rules="[
                (val) => {
                  if (val) {
                    return /^[0-9\-\+\(\) ]+$/.test(val) || 'รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง';
                  }
                  return true;
                },
              ]"
            />

            <!-- Notes -->
            <q-input
              v-model="formData.notes"
              label="หมายเหตุ"
              type="textarea"
              rows="3"
              outlined
              dense
              maxlength="5000"
            />
          </div>
        </q-form>
      </q-card-section>

      <q-card-actions align="right" class="q-pa-md">
        <q-btn flat label="ยกเลิก" color="grey" @click="handleClose" :disable="loading" />
        <q-btn
          flat
          label="บันทึก"
          color="primary"
          @click="handleSubmit"
          :loading="loading"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useQuasar } from 'quasar';
import type { InstallationRequestPayload } from '@/services/sales/salesOrder.service';

interface Props {
  modelValue: boolean;
  salesOrderId: number;
  customerAddresses?: Array<{ id: number; address: string }>;
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void;
  (e: 'submitted', payload: InstallationRequestPayload): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();
const $q = useQuasar();

const formRef = ref();
const loading = ref(false);
const addressType = ref<'existing' | 'custom'>('custom');

const addressTypeOptions = [
  { label: 'ใช้ที่อยู่ที่บันทึกไว้', value: 'existing' },
  { label: 'กำหนดเอง', value: 'custom' },
];

const formData = ref<InstallationRequestPayload>({
  installation_date: '',
  installation_address_id: null,
  installation_address_override: null,
  installation_contact_name: null,
  installation_contact_phone: null,
  notes: null,
});

const addressOptions = computed(() => {
  return props.customerAddresses || [];
});

// Reset form when modal opens
watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) {
      resetForm();
    }
  },
);

const resetForm = () => {
  formData.value = {
    installation_date: '',
    installation_address_id: null,
    installation_address_override: null,
    installation_contact_name: null,
    installation_contact_phone: null,
    notes: null,
  };
  addressType.value = props.customerAddresses && props.customerAddresses.length > 0 ? 'existing' : 'custom';
  formRef.value?.resetValidation();
};

const handleClose = () => {
  emit('update:modelValue', false);
  resetForm();
};

const handleSubmit = async () => {
  const isValid = await formRef.value?.validate();
  if (!isValid) {
    return;
  }

  // Validate address
  if (addressType.value === 'existing' && !formData.value.installation_address_id) {
    $q.notify({
      type: 'negative',
      message: 'กรุณาเลือกที่อยู่ติดตั้ง',
    });
    return;
  }

  if (addressType.value === 'custom' && !formData.value.installation_address_override) {
    $q.notify({
      type: 'negative',
      message: 'กรุณาระบุที่อยู่ติดตั้ง',
    });
    return;
  }

  // Prepare payload
  const payload: InstallationRequestPayload = {
    installation_date: formData.value.installation_date,
    installation_address_id: addressType.value === 'existing' ? (formData.value.installation_address_id ?? null) : null,
    installation_address_override: addressType.value === 'custom' ? (formData.value.installation_address_override ?? null) : null,
    installation_contact_name: formData.value.installation_contact_name || null,
    installation_contact_phone: formData.value.installation_contact_phone || null,
    notes: formData.value.notes || null,
  };

  emit('submitted', payload);
};
</script>

