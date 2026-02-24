'use strict';

module.exports = {
    async receive(context) {
        const {
            apiId,
            prefix,
            name,
            byteLength,
            externalId,
            meta,
            roles,
            permissions,
            expires,
            ratelimits,
            enabled,
            recoverable,
            credits
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
        if (externalId) body.externalId = externalId;

        // Parse and validate meta JSON
        if (meta) {
            try {
                body.meta = JSON.parse(meta);
            } catch (e) {
                throw new context.CancelError('Invalid JSON in metadata field');
            }
        }

        // Parse and validate roles array
        if (roles) {
            try {
                const parsedRoles = JSON.parse(roles);
                if (!Array.isArray(parsedRoles)) {
                    throw new context.CancelError('Roles must be a JSON array');
                }
                body.roles = parsedRoles;
            } catch (e) {
                throw new context.CancelError('Invalid JSON in roles field: ' + e.message);
            }
        }

        // Parse and validate permissions array
        if (permissions) {
            try {
                const parsedPermissions = JSON.parse(permissions);
                if (!Array.isArray(parsedPermissions)) {
                    throw new context.CancelError('Permissions must be a JSON array');
                }
                body.permissions = parsedPermissions;
            } catch (e) {
                throw new context.CancelError('Invalid JSON in permissions field: ' + e.message);
            }
        }

        if (expires) body.expires = new Date(expires).getTime();

        // Parse and validate ratelimits array
        if (ratelimits) {
            try {
                const parsedRatelimits = JSON.parse(ratelimits);
                if (!Array.isArray(parsedRatelimits)) {
                    throw new context.CancelError('Rate limits must be a JSON array');
                }
                body.ratelimits = parsedRatelimits;
            } catch (e) {
                throw new context.CancelError('Invalid JSON in ratelimits field: ' + e.message);
            }
        }

        if (typeof enabled === 'boolean') body.enabled = enabled;
        if (typeof recoverable === 'boolean') body.recoverable = recoverable;

        // Parse and validate credits object
        if (credits) {
            try {
                const parsedCredits = JSON.parse(credits);
                if (typeof parsedCredits !== 'object' || parsedCredits === null) {
                    throw new context.CancelError('Credits must be a JSON object');
                }
                body.credits = parsedCredits;
            } catch (e) {
                throw new context.CancelError('Invalid JSON in credits field: ' + e.message);
            }
        }

        const response = await context.httpRequest({
            method: 'POST',
            url: 'https://api.unkey.com/v2/keys.createKey',
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`,
                'Content-Type': 'application/json'
            },
            data: body
        });

        return context.sendJson({
            keyId: response.data.data.keyId,
            key: response.data.data.key
        }, 'out');
    }
};
