'use strict';

module.exports = {
    async receive(context) {
        const {
            keyId,
            name,
            ownerId,
            meta,
            expires,
            ratelimitType,
            ratelimitLimit,
            ratelimitRefillRate,
            ratelimitRefillInterval,
            enabled
        } = context.messages.in.content;

        if (!keyId) {
            throw new context.CancelError('Key ID is required!');
        }

        const body = {
            keyId
        };

        if (name) body.name = name;
        if (ownerId) body.ownerId = ownerId;
        if (meta) {
            try {
                body.meta = JSON.parse(meta);
            } catch (e) {
                throw new context.CancelError('Invalid JSON in metadata field');
            }
        }
        if (expires) body.expires = expires;
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

        await context.httpRequest({
            method: 'POST',
            url: 'https://api.unkey.dev/v1/keys.updateKey',
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`,
                'Content-Type': 'application/json'
            },
            data: body
        });

        return context.sendJson({}, 'out');
    }
};
