import { REQUESTS_PER_MINUTE } from './config.js'
import { randomUUID } from 'node:crypto'

export const authUsers = [{
    username: 'erickwendel',
    password: '123123',
    role: 'admin',
},
{
    username: 'ananeri',
    password: '1234',
    role: 'member'
}]

export const JWT_SECRET = 'my-secret-key'
export const ADMIN_SUPER_SECRET = 'my-super-secret-key'
const issuedServiceTokens = new Map()

export const rateLimitOptions = {
    max: REQUESTS_PER_MINUTE,
    timeWindow: '1 minute',
    keyGenerator: (request) => request.headers?.authorization?.replace(/bearer/i, '').trim() ?? request.ip,
}

export function initAuthRoute(fastify) {

    fastify.addHook('onRequest', async (request, reply) => {
        const publicRoutes = [
            '/v1/health',
            '/v1/auth/login',
            '/v1/auth/service-token',
        ]

        if (publicRoutes.includes(request.originalUrl)) return;

        const token = request.headers?.authorization?.replace(/bearer/i, '').trim()
        const serviceUser = issuedServiceTokens.get(token)

        if (serviceUser) {
            request.user = serviceUser
            return
        }

        try {

            return await request.jwtVerify()

        } catch (err) {
            console.error('[onRequest]', err)
            return reply.code(401).send({ message: 'Unauthorized' })
        }
    })

    fastify.post('/v1/auth/login', {

        schema: {
            body: {
                type: 'object',
                required: ['username', 'password'],
                properties: {
                    username: { type: 'string' },
                    password: { type: 'string' }
                }
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        token: { type: 'string' }
                    }
                },
                401: {
                    type: 'object',
                    properties: {
                        message: { type: 'string' }
                    }
                }
            }
        }
    }, async (request, reply) => {

        const { username, password } = request.body
        const user = authUsers.find(u => u.username === username && u.password === password)

        if (!user) {
            return reply.code(401).send({ message: 'Invalid username or password' })
        }

        const token = fastify.jwt.sign({ username: user.username, role: user.role })

        reply.send({ token });
    }),

    fastify.post('/v1/auth/service-token', {

        schema: {
            body: {
                type: 'object',
                required: ['username', 'password', 'adminSuperSecret'],
                properties: {
                    username: { type: 'string' },
                    password: { type: 'string' },
                    adminSuperSecret: { type: 'string' }
                }
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        role: { type: 'string' },
                        serviceToken: { type: 'string' }
                    }
                },
                401: {
                    type: 'object',
                    properties: {
                        message: { type: 'string' }
                    }
                }
            }
        }
    }, async (request, reply) => {

        const { username, password, adminSuperSecret } = request.body

        if (adminSuperSecret !== ADMIN_SUPER_SECRET) {
            return reply.code(401).send({ message: 'Invalid adminSuperSecret' })
        }

        const user = authUsers.find(u => u.username === username && u.password === password)

        if (!user) {
            return reply.code(401).send({ message: 'Invalid credentials' })
        }

        const serviceToken = randomUUID();
        issuedServiceTokens.set(serviceToken, { username: user.username, role: user.role });
        reply.send({ serviceToken, role: user.role });
    })
}

export function requireRole(role) {
    return async (request, reply) => {
        const userRole = request.user.role

        if (userRole !== role) {
            return reply.code(403).send({ message: 'Forbidden: insufficient permissions' })
        }
    }
}
