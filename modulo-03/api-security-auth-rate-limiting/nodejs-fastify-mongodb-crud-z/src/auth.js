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

export function initAuthRoute(fastify) {

    fastify.addHook('onRequest', async (request, reply) => {
        const publicRoutes = [
            '/v1/health',
            '/v1/auth/login',
            '/v1/auth/service-token',
        ]

        if (publicRoutes.includes(request.originalUrl)) return;

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
