const SENSITIVE_KEYS = new Set([
  'password',
  'token',
  'access_token',
  'refresh_token',
  'authorization',
  'cookie',
  'set-cookie',
]);

export function maskSensitiveData<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => maskSensitiveData(item)) as T;
  }

  if (value instanceof Date || value === null || value === undefined) {
    return value;
  }

  if (typeof value !== 'object') {
    return value;
  }

  return Object.entries(value).reduce(
    (acc, [key, nestedValue]) => {
      acc[key] = SENSITIVE_KEYS.has(key.toLowerCase())
        ? '[REDACTED]'
        : maskSensitiveData(nestedValue);
      return acc;
    },
    {} as Record<string, unknown>,
  ) as T;
}
