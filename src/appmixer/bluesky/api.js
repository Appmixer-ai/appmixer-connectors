// Auto-generated from OpenAPI spec. Do not edit.

const CreateSession = {
    method: 'POST',
    path: '/xrpc/com.atproto.server.createSession',
    docsUrl: 'https://docs.bsky.app/blog/create-post',
    async execute(context, { identifier, password, ...rest }) {
        const response = await context.httpRequest({
            method: 'POST',
            url: 'https://docs.bsky.app/xrpc/com.atproto.server.createSession',
            data: { identifier, password, ...rest },
            headers: {
                Authorization: `Bearer ${context.auth.accessToken}`
            }
        });
        return response.data;
    }
};

const CreateRecord = {
    method: 'POST',
    path: '/xrpc/com.atproto.repo.createRecord',
    docsUrl: 'https://docs.bsky.app/blog/create-post',
    async execute(context, { repo, collection, record, ...rest }) {
        const response = await context.httpRequest({
            method: 'POST',
            url: 'https://docs.bsky.app/xrpc/com.atproto.repo.createRecord',
            data: { repo, collection, record, ...rest },
            headers: {
                Authorization: `Bearer ${context.auth.accessToken}`
            }
        });
        return response.data;
    }
};

module.exports = {
    CreateSession,
    CreateRecord
};
