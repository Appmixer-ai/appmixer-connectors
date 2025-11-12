'use strict';

module.exports = {
    async receive(context) {
        const {
            apiId,
            prefix,
            name,
            byteLength,
            ownerId,
            meta,
            expires,
            ratelimitType,
            ratelimitLimit,
            ratelimitRefillRate,
            ratelimitRefillInterval,
            remaining,
            enabled
        } = context.messages.in.content;

        if (!apiId) {
            throw new context.CancelError('API ID is required!');
        }

        const body = {
            apiId
        };

        if (prefix) body.prefix = prefix;
        if (name) body.name = name;
        if (byteLength) body.byteLength = byteLength;
        if (ownerId) body.ownerId = ownerId;
        if (meta) {
            try {
                body.meta = JSON.parse(meta);
            } catch (e) {
                throw new context.CancelError('Invalid JSON in metadata field');
            }
        }
        if (expires) body.expires = expires;
        if (remaining) body.remaining = remaining;
        if (typeof enabled === 'boolean') body.enabled = enabled;

        // Add rate limit configuration if specified
        if (ratelimitType) {
            body.ratelimit = {
                type: ratelimitType
            };
            if (ratelimitLimit) body.ratelimit.limit = ratelimitLimit;
            if (ratelimitRefillRate) body.ratelimit.refillRate = ratelimitRefillRate;
            if (ratelimitRefillInterval) body.ratelimit.refillInterval = ratelimitRefillInterval;
        }

        const { data } = await context.httpRequest({
            method: 'POST',
            url: 'https://api.unkey.dev/v1/keys.createKey',
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`,
                'Content-Type': 'application/json'
            },
            data: body
        });

        return context.sendJson({
            keyId: data.keyId,
            key: data.key,
            apiId,
            name,
            ownerId
        }, 'out');
    }
};
