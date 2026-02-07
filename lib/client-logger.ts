// ============================================
// Client-Side Logger
// ============================================
// Browser-safe logger with the same API shape as the server logger.
// Suppresses debug logs in production.

const isProduction = process.env.NODE_ENV === 'production';
const logLevel = process.env.NEXT_PUBLIC_LOG_LEVEL || (isProduction ? 'info' : 'debug');

const levels: Record<string, number> = {
    debug: 10,
    info: 20,
    warn: 30,
    error: 40,
};

const currentLevel = levels[logLevel] ?? levels.info;

function shouldLog(level: string): boolean {
    return (levels[level] ?? 0) >= currentLevel;
}

interface LogFn {
    (obj: Record<string, unknown>, msg?: string): void;
    (msg: string): void;
}

function createLogFn(level: string): LogFn {
    return (...args: [Record<string, unknown>, string?] | [string]) => {
        if (!shouldLog(level)) return;

        const consoleFn =
            level === 'error' ? console.error :
            level === 'warn' ? console.warn :
            level === 'debug' ? console.debug :
            console.info;

        if (typeof args[0] === 'string') {
            consoleFn(`[${level.toUpperCase()}]`, args[0]);
        } else {
            consoleFn(`[${level.toUpperCase()}]`, args[1] || '', args[0]);
        }
    };
}

export interface ClientLogger {
    debug: LogFn;
    info: LogFn;
    warn: LogFn;
    error: LogFn;
    child: (context: Record<string, unknown>) => ClientLogger;
}

function createLogger(context?: Record<string, unknown>): ClientLogger {
    const wrapWithContext = (fn: LogFn): LogFn => {
        return (...args: [Record<string, unknown>, string?] | [string]) => {
            if (typeof args[0] === 'string') {
                fn({ ...context }, args[0]);
            } else {
                fn({ ...context, ...args[0] }, args[1]);
            }
        };
    };

    const base: ClientLogger = {
        debug: createLogFn('debug'),
        info: createLogFn('info'),
        warn: createLogFn('warn'),
        error: createLogFn('error'),
        child: (childContext: Record<string, unknown>) =>
            createLogger({ ...context, ...childContext }),
    };

    if (context) {
        return {
            debug: wrapWithContext(base.debug),
            info: wrapWithContext(base.info),
            warn: wrapWithContext(base.warn),
            error: wrapWithContext(base.error),
            child: base.child,
        };
    }

    return base;
}

export const clientLogger = createLogger();

export function createClientModuleLogger(module: string): ClientLogger {
    return clientLogger.child({ module });
}
