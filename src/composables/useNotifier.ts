import { Notify, type QNotifyCreateOptions } from 'quasar';

type NotifyController = Pick<typeof Notify, 'create'>;

interface NotifyParams {
  message: string;
  caption?: string;
  icon?: string;
  timeout?: number;
  options?: Partial<QNotifyCreateOptions>;
}

const baseOptions: Partial<QNotifyCreateOptions> = {
  position: 'top-right',
  timeout: 2500,
};

const buildOptions = (
  type: QNotifyCreateOptions['type'] | undefined,
  { message, caption, icon, timeout, options }: NotifyParams & { icon: string },
): QNotifyCreateOptions => {
  const resolvedTimeout = timeout ?? options?.timeout ?? baseOptions.timeout ?? 2500;

  const payload: QNotifyCreateOptions = {
    ...baseOptions,
    ...options,
    icon,
    message,
    timeout: resolvedTimeout,
    ...(caption !== undefined ? { caption } : {}),
  };

  if (type) {
    payload.type = type;
  }

  return payload;
};

export const useNotifier = (api: NotifyController = Notify) => {
  const success = (params: NotifyParams) =>
    api.create(
      buildOptions('positive', {
        ...params,
        icon: params.icon ?? 'check_circle',
      }),
    );

  const error = (params: NotifyParams) =>
    api.create(
      buildOptions('negative', {
        ...params,
        icon: params.icon ?? 'error',
        timeout: params.timeout ?? params.options?.timeout ?? 4000,
      }),
    );

  const info = (params: NotifyParams) =>
    api.create(
      buildOptions('info', {
        ...params,
        icon: params.icon ?? 'info',
      }),
    );

  return {
    success,
    error,
    info,
  };
};

