'use strict';

// curl -XPOST \
//     -H 'Content-Type: application/json' \
//     -H "Authorization: Bearer ACCESS_TOKEN" \
//     -d '{
//         "id": "msg123",
//         "content": "Hi, what's the capital of Czechia?",
//         "role": "user",
//         "flowId": "flow123",
//         "componentId": "comp123",
//         "chatId": "chat123",
//         "userId": "user123"
//      }' \
// "https://APPMIXER_TENANT_API_URL/plugins/appmixer/utils/chat/messages/{CHAT_ID}"

const fs = require('fs');
const uuid = require('uuid');
const { PassThrough } = require('stream');

const chatBundleJs = fs.readFileSync(__dirname + '/chat.bundle.js', 'utf8');

module.exports = (context) => {

    const ChatMessage = require('./ChatMessageModel')(context);
    const ChatSession = require('./ChatSessionModel')(context);
    const ChatAgent = require('./ChatAgentModel')(context);
    const ChatThread = require('./ChatThreadModel')(context);

    // ASSETS

    context.http.router.register({
        method: 'GET',
        path: '/assets/chat.bundle.js',
        options: {
            auth: false,
            handler: async (req, h) => {
                return h.response(chatBundleJs).type('text/javascript');
            }
        }
    });

    // MESSAGES

    context.http.router.register({
        method: 'POST',
        path: '/messages/{threadId}',
        options: {
            auth: {
                strategies: ['jwt-strategy', 'public']
            },
            handler: async (req) => {
                const { threadId } = req.params;
                const user = await context.http.auth.getUser(req);
                const userId = user.getId();
                // { id, content, role, flowId, componentId }
                const message = req.payload;
                message.id = uuid.v6(); // UUID v6 is time ordered.
                message.threadId = threadId;
                message.createdAt = new Date;
                message.userId = userId;
                await context.pubSubPublish(`stream:chat:events:${threadId}`, {
                    type: 'message',
                    data: message
                });
                return new ChatMessage().populate(message).save();
            }
        }
    });

    context.http.router.register({
        method: 'GET',
        path: '/messages/{threadId}',
        options: {
            auth: {
                strategies: ['jwt-strategy', 'public']
            },
            handler: async (req) => {
                const { threadId } = req.params;
                const { sinceId } = req.query;
                const user = await context.http.auth.getUser(req);
                const userId = user.getId();
                // TODO: pagination.
                const query = { threadId, userId };
                if (sinceId) {
                    // ID is a time ordered UUID (v6).
                    query.id = { $gt: sinceId };
                }
                const options = { sort: { id: 1 } };
                const messages = await ChatMessage.find(query, options);
                return messages;
            }
        }
    });

    context.http.router.register({
        method: 'DELETE',
        path: '/messages/{threadId}',
        options: {
            auth: {
                strategies: ['jwt-strategy', 'public']
            },
            handler: async (req) => {
                const { threadId } = req.params;
                const user = await context.http.auth.getUser(req);
                const userId = user.getId();
                await ChatMessage.deleteMany({ threadId, userId });
                return {};
            }
        }
    });

    // SSE

    context.http.router.register({
        method: 'GET',
        path: '/events/{threadId}',
        options: {
            auth: {
                strategies: ['jwt-strategy', 'public']
            },
            cors: {
                origin: ['*']
            },
            handler: async (request, h) => {
                const { threadId } = request.params;

                const stream = new PassThrough();
                const response = h.response(stream);
                response.type('text/event-stream');
                response.header('Cache-Control', 'no-cache');
                response.header('Connection', 'keep-alive');
                // Force raw, uncompressed output.
                // This is necessary to avoid the ERR_INCOMPLETE_CHUNKED_ENCODING error.
                // It essentially disables response compression which interfers with
                // streaming behaviour.
                response.header('Content-Encoding', 'identity');
                stream.write(': init\n\n'); // Send SSE comment to kickstart stream.

                const sendEvent = (data) => {
                    if (!stream.writableEnded) {
                        stream.write(`data: ${JSON.stringify(data)}\n\n`);
                    }
                };

                // Track subscriptions and state so the close handler can clean them
                // up even if the client disconnects during the subscribe awaits.
                let subChat = null;
                let subAgent = null;
                let closed = false;

                // Necessary to keep the connection alive. Otherwise it closes after
                // a timeout interval set on the load balancer/proxy (typically 1 minute).
                const heartbeat = setInterval(() => {
                    if (!stream.writableEnded) {
                        stream.write(': ping\n\n');
                    }
                }, context.config.SSE_HEARTBEAT_INTERVAL || 15000);

                // Attach the close handler BEFORE awaiting subscriptions to avoid a
                // race where the client disconnects during the subscribe call and the
                // cleanup never runs.
                request.raw.req.on('close', () => {
                    closed = true;
                    clearInterval(heartbeat);
                    // Use Promise.allSettled so both unsubscribes always run, even if
                    // one rejects, and always end the stream in finally.
                    Promise.allSettled([
                        subChat ? subChat.unsubscribe() : Promise.resolve(),
                        subAgent ? subAgent.unsubscribe() : Promise.resolve()
                    ]).finally(() => {
                        if (!stream.writableEnded) {
                            stream.end();
                        }
                    });
                });

                // Subscribe to the exact channels for this thread.
                // Using exact-channel subscribe avoids the need for psubscribe ACL permission.
                subChat = await context.pubSubSubscribe(`stream:chat:events:${threadId}`, sendEvent);
                subAgent = await context.pubSubSubscribe(`stream:agent:events:${threadId}`, sendEvent);

                // If the client already disconnected during the subscribe calls, clean up immediately.
                if (closed) {
                    await Promise.allSettled([subChat.unsubscribe(), subAgent.unsubscribe()]);
                    if (!stream.writableEnded) stream.end();
                    return response;
                }

                return response;
            }
        }
    });

    // SESSIONS

    context.http.router.register({
        method: 'GET',
        path: '/sessions/{sessionId}',
        options: {
            auth: {
                strategies: ['jwt-strategy', 'public']
            },
            handler: async (req) => {
                const { sessionId } = req.params;
                const user = await context.http.auth.getUser(req);
                const userId = user.getId();
                const query = { id: sessionId, userId };
                const session = await ChatSession.findOne(query);
                if (!session) return null;
                const threads = await ChatThread.find({ sessionId });
                session.threads = threads;
                return session;
            }
        }
    });

    context.http.router.register({
        method: 'POST',
        path: '/sessions',
        options: {
            auth: {
                strategies: ['jwt-strategy', 'public']
            },
            handler: async (req) => {
                const session = req.payload;
                const user = await context.http.auth.getUser(req);
                session.id = session.id || uuid.v4();
                session.userId = user.getId();
                session.createdAt = new Date;
                return new ChatSession().populate(session).save();
            }
        }
    });

    // THREADS

    context.http.router.register({
        method: 'GET',
        path: '/threads/{threadId}',
        options: {
            auth: {
                strategies: ['jwt-strategy', 'public']
            },
            handler: async (req) => {
                const { threadId } = req.params;
                const query = { id: threadId };
                const thread = await ChatThread.findOne(query);
                return thread;
            }
        }
    });

    context.http.router.register({
        method: 'POST',
        path: '/threads',
        options: {
            auth: {
                strategies: ['jwt-strategy', 'public']
            },
            handler: async (req) => {
                const thread = req.payload;
                const user = await context.http.auth.getUser(req);
                const userId = user.getId();
                thread.id = uuid.v4();
                thread.createdAt = new Date;
                thread.userId = userId;
                return new ChatThread().populate(thread).save();
            }
        }
    });

    context.http.router.register({
        method: 'DELETE',
        path: '/threads/{threadId}',
        options: {
            auth: {
                strategies: ['jwt-strategy', 'public']
            },
            handler: async (req) => {
                const { threadId } = req.params;
                await ChatThread.deleteById(threadId);
                return {};
            }
        }
    });

    // AGENTS

    context.http.router.register({
        method: 'GET',
        path: '/agents/{agentId}',
        options: {
            auth: {
                strategies: ['jwt-strategy', 'public']
            },
            handler: async (req) => {
                const { agentId } = req.params;
                const user = await context.http.auth.getUser(req);
                const userId = user.getId();
                const query = { id: agentId, userId };
                const agent = await ChatAgent.findOne(query);
                return agent;
            }
        }
    });

    context.http.router.register({
        method: 'GET',
        path: '/agents',
        options: {
            auth: {
                strategies: ['jwt-strategy', 'public']
            },
            handler: async (req) => {
                const { flowId, componentId } = req.query;
                const user = await context.http.auth.getUser(req);
                const userId = user.getId();
                const query = { userId };
                if (flowId) query.flowId = flowId;
                if (componentId) query.componentId = componentId;
                const options = { sort: { createdAt: -1 } };
                const agents = await ChatAgent.find(query, options);
                return agents;
            }
        }
    });

    context.http.router.register({
        method: 'POST',
        path: '/agents',
        options: {
            auth: {
                strategies: ['jwt-strategy', 'public']
            },
            handler: async (req) => {
                const agent = req.payload;
                const user = await context.http.auth.getUser(req);
                agent.id = uuid.v4();
                agent.userId = user.getId();
                agent.createdAt = new Date;
                return new ChatAgent().populate(agent).save();
            }
        }
    });

    context.http.router.register({
        method: 'PUT',
        path: '/agents/{agentId}',
        options: {
            auth: {
                strategies: ['jwt-strategy', 'public']
            },
            handler: async (req) => {
                const { agentId } = req.params;
                const update = req.payload;
                const user = await context.http.auth.getUser(req);
                const userId = user.getId();
                const query = { id: agentId, userId };
                const agent = await ChatAgent.findOne(query);
                return agent.populate(update).save();
            }
        }
    });

    context.http.router.register({
        method: 'DELETE',
        path: '/agents/{agentId}',
        options: {
            auth: {
                strategies: ['jwt-strategy', 'public']
            },
            handler: async (req) => {
                const { agentId } = req.params;
                await ChatAgent.deleteById(agentId);
                return {};
            }
        }
    });

};
