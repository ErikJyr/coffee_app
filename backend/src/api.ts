import type { FastifyBaseLogger, FastifyInstance, RawServerDefault } from 'fastify'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox'
import { ApiError } from './models.js'

export type Api = FastifyInstance<RawServerDefault, IncomingMessage, ServerResponse, FastifyBaseLogger, TypeBoxTypeProvider>
export const errorResponses = { 400: ApiError, 401: ApiError, 403: ApiError, 404: ApiError, 409: ApiError, 413: ApiError, 415: ApiError, 429: ApiError, 500: ApiError }
export const cookieSecurity = [{ session: [] }]
export const csrfSecurity = [{ session: [], csrf: [] }]
