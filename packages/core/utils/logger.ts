import pino, { Logger } from 'pino'
import pinoPretty from 'pino-pretty'

export const createLogger = (verbose: boolean = false) =>
  verbose
    ? pino(
        pinoPretty({
          colorize: true,
        })
      )
    : ({
      info: () => { },
      debug: () => { },
      error: () => { },
      warn: () => { },
    } as unknown as Logger)
