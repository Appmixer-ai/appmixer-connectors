'use strict';

const lib = require('../../lib');

// Schema of a single session item
const schema = {
    'id': {
        'type': 'string',
        'title': 'Session ID'
    },
    'object': {
        'type': 'string',
        'title': 'Object'
    },
    'user_id': {
        'type': 'string',
        'title': 'User ID'
    },
    'client_id': {
        'type': 'string',
        'title': 'Client ID'
    },
    'status': {
        'type': 'string',
        'title': 'Status'
    },
    'last_active_at': {
        'type': 'number',
        'title': 'Last Active At'
    },
    'last_active_organization_id': {
        'type': 'string',
        'title': 'Last Active Organization ID'
    },
    'actor': {
        'type': 'object',
        'properties': {
            'id': { 'type': 'string', 'title': 'Actor.ID' },
            'object': { 'type': 'string', 'title': 'Actor.Object' }
        },
        'title': 'Actor'
    },
    'created_at': {
        'type': 'number',
        'title': 'Created At'
    },
    'updated_at': {
        'type': 'number',
        'title': 'Updated At'
    },
    'abandoned_at': {
        'type': 'number',
        'title': 'Abandoned At'
    },
    'expire_at': {
        'type': 'number',
        'title': 'Expire At'
    }
};

module.exports = {

    async receive(context) {
        const {
            userId,
            clientId,
            sessionId,
            outputType = 'array'
        } = context.messages.in.content;

        // Generate output port schema dynamically based on the outputType
        // This is triggered by definition from the component.json, outPorts.out.source.url
        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Sessions' });
        }

        // At least one of client_id or user_id parameters should be provided.
        if (!userId && !clientId) {
            throw new context.CancelError('At least one of User ID or Client ID is required');
        }

        // Build query parameters
        const queryParams = new URLSearchParams();
        if (userId) queryParams.append('user_id', userId);
        if (clientId) queryParams.append('client_id', clientId);
        if (sessionId) queryParams.append('session_id', sessionId);

        // Make API request
        const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://api.clerk.com/v1/sessions${queryString}`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            }
        });

        // Extract sessions array from response
        const sessions = data && Array.isArray(data) ? data : [];

        // Check if this is legacy mode (no outputType specified) for backward compatibility
        if (!context.messages.in.content.outputType) {
            // Legacy format for backward compatibility with existing tests
            return context.sendJson({ sessions }, 'out');
        }

        if (sessions.length === 0) {
            return context.sendJson({}, 'notFound');
        }

        // Use lib function to handle different output types
        return lib.sendArrayOutput({ context, records: sessions, outputType });
    }
};
