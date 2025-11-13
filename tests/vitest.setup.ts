import { config, RouterLinkStub } from '@vue/test-utils';
import { defineComponent, h } from 'vue';
import { createI18n } from 'vue-i18n';
import { vi } from 'vitest';
import { Notify, Loading, Dialog } from 'quasar';
import enUS from '@/i18n/en-US';

Notify.create = vi.fn();
Loading.show = vi.fn();
Loading.hide = vi.fn();
Dialog.create = vi.fn(() => {
  const chain = {
    onOk(callback?: () => void) {
      callback?.();
      return chain;
    },
    onCancel(callback?: () => void) {
      callback?.();
      return chain;
    },
    onDismiss(callback?: () => void) {
      callback?.();
      return chain;
    },
    hide() {
      return chain;
    },
    update() {
      return chain;
    },
  };
  return chain;
});

const createStub = (name: string) =>
  defineComponent({
    name: `${name}-stub`,
    props: ['modelValue'],
    emits: ['update:modelValue'],
    setup(props, { slots, emit, attrs }) {
      const { onClick, ...restAttrs } = attrs;

      const updateModel = (value: unknown) => emit('update:modelValue', value);

      return () =>
        h(
          'div',
          {
            class: name,
            'data-stub': name,
            ...restAttrs,
            onClick: () => {
              const nextValue =
                typeof props.modelValue === 'boolean' ? !props.modelValue : props.modelValue;
              updateModel(nextValue);
              if (typeof onClick === 'function') {
                onClick(new MouseEvent('click'));
              }
            },
          },
          [
            slots.default?.(),
            slots.header?.(),
            slots.section?.(),
            slots.actions?.(),
            slots.caption?.(),
            slots.item?.(),
            slots.avatar?.(),
            slots.side?.(),
          ],
        );
    },
  });

const quasarComponents = [
  'q-layout',
  'q-header',
  'q-toolbar',
  'q-toolbar-title',
  'q-btn',
  'q-drawer',
  'q-list',
  'q-item',
  'q-item-section',
  'q-item-label',
  'q-page-container',
  'q-page',
  'q-card',
  'q-card-section',
  'q-card-actions',
  'q-separator',
  'q-spinner',
  'q-banner',
  'q-icon',
  'q-badge',
  'q-markup-table',
  'q-expansion-item',
  'q-breadcrumbs',
  'q-breadcrumbs-el',
  'q-scroll-area',
  'q-tree',
  'q-space',
  'q-tooltip',
  'q-skeleton',
  'q-form',
  'q-input',
  'q-select',
  'q-table',
  'q-tr',
  'q-td',
  'q-dialog',
  'q-tabs',
  'q-tab',
  'q-tab-panel',
  'q-tab-panels',
];

config.global.stubs = {
  ...(config.global.stubs || {}),
  transition: false,
  'transition-group': false,
  'router-link': RouterLinkStub,
  RouterLink: RouterLinkStub,
};

quasarComponents.forEach((component) => {
  config.global.stubs![component] = createStub(component);
});

config.global.mocks = {
  ...(config.global.mocks || {}),
  $q: {
    version: 'test',
    screen: {
      gt: { sm: false },
      lt: { md: false },
    },
    notify: () => undefined,
    dialog: () => {
      const chain = {
        onOk(callback?: () => void) {
          callback?.();
          return chain;
        },
        onCancel(callback?: () => void) {
          callback?.();
          return chain;
        },
        onDismiss(callback?: () => void) {
          callback?.();
          return chain;
        },
        hide: () => chain,
        update: () => chain,
      };
      return chain;
    },
  },
};

config.global.provide = {
  ...(config.global.provide || {}),
  _q: {
    screen: {
      gt: { sm: false },
      lt: { md: false },
    },
  },
};

config.global.directives = {
  ...(config.global.directives || {}),
  ripple: () => undefined,
};

const i18n = createI18n({
  legacy: false,
  locale: 'en-US',
  messages: {
    'en-US': enUS,
  },
});

config.global.plugins = config.global.plugins || [];
config.global.plugins.push(i18n);

