import pino, { Logger } from 'pino'

export const createLogger = (verbose: boolean = false) =>
  verbose
    ? pino({
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
          },
        },
      })
    : ({
      info: () => { },
      debug: () => { },
      error: () => { },
      warn: () => { },
    } as unknown as Logger)
