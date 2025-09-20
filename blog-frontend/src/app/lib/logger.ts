type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent';

function resolveLevel(): LogLevel {
  const env = (process.env.NEXT_PUBLIC_LOG_LEVEL || '').toLowerCase();
  if (env === 'debug' || env === 'info' || env === 'warn' || env === 'error' || env === 'silent') return env as LogLevel;
  // Default: verbose in dev, info in prod
  if (process.env.NODE_ENV !== 'production') return 'debug';
  return 'info';
}

let LEVEL: LogLevel = resolveLevel();

function shouldLog(target: LogLevel): boolean {
  const order: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40, silent: 100 };
  return order[target] >= order[LEVEL];
}

export const logger = {
  setLevel(l: LogLevel) { LEVEL = l; },
  debug(...args: any[]) { if (shouldLog('debug')) console.debug('[DEBUG]', ...args); },
  info(...args: any[]) { if (shouldLog('info')) console.info('[INFO]', ...args); },
  warn(...args: any[]) { if (shouldLog('warn')) console.warn('[WARN]', ...args); },
  error(...args: any[]) { if (shouldLog('error')) console.error('[ERROR]', ...args); },
};

// Dev-only helper to reduce production noise
export function devLog(...args: any[]) {
  if (process.env.NODE_ENV !== 'production') console.debug('[DEV]', ...args);
}
