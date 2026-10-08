import { Type, type Static } from '@sinclair/typebox'
import { Value } from '@sinclair/typebox/value'

const ConfigSchema = Type.Object({
  environment: Type.Union([Type.Literal('development'), Type.Literal('production'), Type.Literal('test')]),
  host: Type.String({ minLength: 1 }), port: Type.Integer({ minimum: 1, maximum: 65535 }),
  appOrigin: Type.String({ minLength: 1 }), databasePath: Type.String({ minLength: 1 }),
})
export type Config = Static<typeof ConfigSchema>

/** Require explicit settings; production cookies require an HTTPS frontend origin. */
export function loadConfig(environment: NodeJS.ProcessEnv): Config {
  const config = {
    environment: environment.NODE_ENV, host: environment.HOST,
    port: Number(environment.PORT), appOrigin: environment.APP_ORIGIN, databasePath: environment.DATABASE_PATH,
  }
  if (!Value.Check(ConfigSchema, config)) {
    const errors = [...Value.Errors(ConfigSchema, config)].map((error) => `${error.path}: ${error.message}`)
    throw new Error(`Invalid backend environment. Copy .env.example to .env and set all fields. ${errors.join('; ')}`)
  }
  const origin = new URL(config.appOrigin)
  if (!['http:', 'https:'].includes(origin.protocol) || origin.origin !== config.appOrigin) {
    throw new Error('APP_ORIGIN must be an exact HTTP(S) origin, without a path, credentials, or trailing slash.')
  }
  if (config.environment === 'production' && origin.protocol !== 'https:') {
    throw new Error('Production APP_ORIGIN must use HTTPS so authentication cookies can be Secure.')
  }
  return config
}
