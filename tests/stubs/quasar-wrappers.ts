export function defineBoot<T extends (...args: any[]) => any>(callback: T): T {
  return callback;
}

export function route<T>(callback: T): T {
  return callback;
}

export default {
  defineBoot,
  route,
};

