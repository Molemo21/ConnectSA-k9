type LogLevel = 'error' | 'warn' | 'info' | 'debug';

interface LogData {
  [key: string]: any;
}

function formatLogMessage(level: LogLevel, context: string, message: string, data?: LogData): string {
  const timestamp = new Date().toISOString();
  const dataString = data ? `\nData: ${JSON.stringify(data, null, 2)}` : '';
  return `[${timestamp}] ${level.toUpperCase()} [${context}] ${message}${dataString}`;
}

export function logError(context: string, message: string, error?: Error, data?: LogData) {
  console.error(formatLogMessage('error', context, message, {
    ...data,
    error: error ? {
      message: error.message,
      stack: error.stack,
      name: error.name
    } : undefined
  }));
}

export function logWarning(context: string, message: string, data?: LogData) {
  console.warn(formatLogMessage('warn', context, message, data));
}

export function logInfo(context: string, message: string, data?: LogData) {
  console.info(formatLogMessage('info', context, message, data));
}

export function logDebug(context: string, message: string, data?: LogData) {
  if (process.env.NODE_ENV === 'development') {
    console.debug(formatLogMessage('debug', context, message, data));
  }
}

// Specialized loggers for specific features
export const logBooking = {
  error: (action: string, message: string, error: Error, data?: LogData) => 
    logError('booking', `[${action}] ${message}`, error, data),
  warning: (action: string, message: string, data?: LogData) => 
    logWarning('booking', `[${action}] ${message}`, data),
  info: (action: string, message: string, data?: LogData) => 
    logInfo('booking', `[${action}] ${message}`, data),
  success: (action: string, message: string, data?: LogData) => 
    logInfo('booking', `✓ [${action}] ${message}`, data)
};

export const logAuth = {
  error: (action: string, message: string, error: Error, data?: LogData) => 
    logError('auth', `[${action}] ${message}`, error, data),
  warning: (action: string, message: string, data?: LogData) => 
    logWarning('auth', `[${action}] ${message}`, data),
  info: (action: string, message: string, data?: LogData) => 
    logInfo('auth', `[${action}] ${message}`, data),
  success: (action: string, message: string, data?: LogData) => 
    logInfo('auth', `✓ [${action}] ${message}`, data)
};

export const logService = {
  error: (action: string, message: string, error: Error, data?: LogData) => 
    logError('service', `[${action}] ${message}`, error, data),
  warning: (action: string, message: string, data?: LogData) => 
    logWarning('service', `[${action}] ${message}`, data),
  info: (action: string, message: string, data?: LogData) => 
    logInfo('service', `[${action}] ${message}`, data),
  success: (action: string, message: string, data?: LogData) => 
    logInfo('service', `✓ [${action}] ${message}`, data)
};

export const logPayment = {
  error: (action: string, message: string, error: Error, data?: LogData) => 
    logError('payment', `[${action}] ${message}`, error, data),
  warning: (action: string, message: string, data?: LogData) => 
    logWarning('payment', `[${action}] ${message}`, data),
  info: (action: string, message: string, data?: LogData) => 
    logInfo('payment', `[${action}] ${message}`, data),
  success: (action: string, message: string, data?: LogData) => 
    logInfo('payment', `✓ [${action}] ${message}`, data)
};

export const logDashboard = {
  error: (action: string, message: string, error: Error, data?: LogData) => 
    logError('dashboard', `[${action}] ${message}`, error, data),
  warning: (action: string, message: string, data?: LogData) => 
    logWarning('dashboard', `[${action}] ${message}`, data),
  info: (action: string, message: string, data?: LogData) => 
    logInfo('dashboard', `[${action}] ${message}`, data),
  success: (action: string, message: string, data?: LogData) => 
    logInfo('dashboard', `✓ [${action}] ${message}`, data)
};

export const logSystem = {
  error: (action: string, message: string, error: Error, data?: LogData) => 
    logError('system', `[${action}] ${message}`, error, data),
  warning: (action: string, message: string, data?: LogData) => 
    logWarning('system', `[${action}] ${message}`, data),
  info: (action: string, message: string, data?: LogData) => 
    logInfo('system', `[${action}] ${message}`, data),
  success: (action: string, message: string, data?: LogData) => 
    logInfo('system', `✓ [${action}] ${message}`, data)
};

// Default logger export for backward compatibility
export const logger = {
  error: logError,
  warning: logWarning,
  info: logInfo,
  debug: logDebug
};