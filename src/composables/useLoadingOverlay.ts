import { Loading, QSpinnerIos, type QLoadingShowOptions } from 'quasar';

type LoadingController = Pick<typeof Loading, 'show' | 'hide'>;

const defaultOptions: QLoadingShowOptions = {
  spinner: QSpinnerIos,
  spinnerColor: 'primary',
  backgroundColor: 'rgba(0, 0, 0, 0.35)',
};

export const useLoadingOverlay = (api: LoadingController = Loading) => {
  const show = (message?: string, options?: QLoadingShowOptions) => {
    const payload: QLoadingShowOptions = {
      ...defaultOptions,
      ...(options ?? {}),
      ...(message !== undefined ? { message } : {}),
    };
    api.show(payload);
  };

  const hide = () => {
    api.hide();
  };

  const withLoading = async <T>(operation: () => Promise<T>, opts?: QLoadingShowOptions) => {
    show(opts?.message, opts);
    try {
      return await operation();
    } finally {
      hide();
    }
  };

  return {
    show,
    hide,
    withLoading,
  };
};

