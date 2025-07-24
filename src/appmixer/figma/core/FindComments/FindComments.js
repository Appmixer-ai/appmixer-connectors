'use strict';

const lib = require('../../lib.generated');
const schema = {
    'id': {
        'type': 'string',
        'title': 'Id'
    },
    'uuid': {
        'type': 'null',
        'title': 'Uuid'
    },
    'file_key': {
        'type': 'string',
        'title': 'File Key'
    },
    'parent_id': {
        'type': 'string',
        'title': 'Parent Id'
    },
    'user': {
        'type': 'object',
        'properties': {
            'handle': {
                'type': 'string',
                'title': 'User.Handle'
            },
            'img_url': {
                'type': 'string',
                'title': 'User.Img Url'
            },
            'id': {
                'type': 'string',
                'title': 'User.Id'
            }
        },
        'title': 'User'
    },
    'created_at': {
        'type': 'string',
        'title': 'Created At'
    },
    'resolved_at': {
        'type': 'null',
        'title': 'Resolved At'
    },
    'message': {
        'type': 'string',
        'title': 'Message'
    },
    'reactions': {
        'type': 'array',
        'items': {},
        'title': 'Reactions'
    },
    'client_meta': {
        'type': 'object',
        'properties': {
            'x': {
                'type': 'number',
                'title': 'Client Meta.X'
            },
            'y': {
                'type': 'number',
                'title': 'Client Meta.Y'
            }
        },
        'title': 'Client Meta'
    },
    'order_id': {
        'type': 'string',
        'title': 'Order Id'
    }
};

module.exports = {

    async receive(context) {

        const { fileId, query, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Comments' });
        }

        if (!fileId) {
            throw new context.CancelError('FileId is required');
        }

        // https://www.figma.com/developers/api#comments-get
        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://api.figma.com/v1/files/${fileId}/comments`,
            headers: {
                'Authorization': `Bearer ${context.auth?.accessToken}`
            }
        });

        let records = data?.comments || [];
        // Apply query filter if provided
        if (query && query.trim()) {
            records = records.filter(comment =>
                comment?.message?.toLowerCase().includes(query.toLowerCase())
            );
        }
        // Send to notFound port if no records are found
        if (records.length === 0) {
            return context.sendJson({
                message: 'No comments found',
                fileId: fileId
            }, 'notFound');
        }

        return lib.sendArrayOutput({
            context,
            records,
            outputType
        });
    }
};
