'use strict';

const lib = require('../../lib');

// The output contract of one item. Exported because the output port is dynamic.
const ITEM_SCHEMA = {
    type: 'object',
    properties: {
        id: {
            type: 'string',
            title: 'Item ID',
            example: '3458764517517819000'
        },
        type: {
            type: 'string',
            title: 'Type',
            example: 'sticky_note'
        },
        data: {
            type: 'object',
            title: 'Data',
            properties: {
                content: {
                    type: 'string',
                    title: 'Data.Content',
                    example: '<p>Ship the beta</p>'
                },
                title: {
                    type: 'string',
                    title: 'Data.Title',
                    example: 'Release checklist'
                },
                description: {
                    type: 'string',
                    title: 'Data.Description',
                    example: 'Steps before the release'
                },
                shape: {
                    type: 'string',
                    title: 'Data.Shape',
                    example: 'square'
                }
            },
            required: []
        },
        position: {
            type: 'object',
            title: 'Position',
            properties: {
                x: {
                    type: 'number',
                    title: 'Position.X',
                    example: 0
                },
                y: {
                    type: 'number',
                    title: 'Position.Y',
                    example: 0
                },
                origin: {
                    type: 'string',
                    title: 'Position.Origin',
                    example: 'center'
                },
                relativeTo: {
                    type: 'string',
                    title: 'Position.Relative To',
                    example: 'canvas_center'
                }
            },
            required: [
                'x',
                'y'
            ]
        },
        geometry: {
            type: 'object',
            title: 'Geometry',
            properties: {
                width: {
                    type: 'number',
                    title: 'Geometry.Width',
                    example: 199.99
                },
                height: {
                    type: 'number',
                    title: 'Geometry.Height',
                    example: 228
                },
                rotation: {
                    type: 'number',
                    title: 'Geometry.Rotation',
                    example: 0
                }
            },
            required: []
        },
        parent: {
            type: 'object',
            title: 'Parent',
            properties: {
                id: {
                    type: 'string',
                    title: 'Parent.ID',
                    example: '3458764517517818000'
                }
            },
            required: []
        },
        createdAt: {
            type: 'string',
            format: 'date-time',
            title: 'Created At',
            example: '2026-11-20T09:20:00Z'
        },
        modifiedAt: {
            type: 'string',
            format: 'date-time',
            title: 'Modified At',
            example: '2026-11-20T09:20:00Z'
        },
        createdBy: {
            type: 'object',
            title: 'Created By',
            properties: {
                id: {
                    type: 'string',
                    title: 'Created By.ID',
                    example: '3458764512345678901'
                },
                type: {
                    type: 'string',
                    title: 'Created By.Type',
                    example: 'user'
                }
            },
            required: [
                'id'
            ]
        },
        modifiedBy: {
            type: 'object',
            title: 'Modified By',
            properties: {
                id: {
                    type: 'string',
                    title: 'Modified By.ID',
                    example: '3458764512345678901'
                },
                type: {
                    type: 'string',
                    title: 'Modified By.Type',
                    example: 'user'
                }
            },
            required: [
                'id'
            ]
        }
    },
    required: [
        'id',
        'type'
    ]
};

module.exports = {

    ITEM_SCHEMA,

    async receive(context) {

        const { boardId: rawBoardId, type, outputType } = context.messages.in.content;
        const { isSource } = context.properties;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, ITEM_SCHEMA.properties, { label: 'Items', value: 'result' });
        }

        if (isSource && !rawBoardId) {
            return context.sendJson({ result: [], count: 0 }, 'out');
        }

        let items;
        try {
            if (!rawBoardId) {
                throw new context.CancelError('Board is required!');
            }
            const boardId = lib.requireId(context, rawBoardId, 'Board');
            const list = async () => (await lib.listItemsPage(context, boardId, { type })).items;
            items = isSource
                ? await lib.callCached(context, { op: 'items', boardId, type }, list)
                : await list();
        } catch (err) {
            if (isSource) {
                return context.sendJson({ result: [], count: 0 }, 'out');
            }
            throw err;
        }

        if (isSource) {
            return context.sendJson({ result: items, count: items.length }, 'out');
        }
        if (!items.length) {
            return context.sendJson({}, 'notFound');
        }
        return lib.sendArrayOutput({ context, outputType, records: items });
    },

    toSelectArray({ result }) {

        return (result || []).map(item => {
            const data = item.data || {};
            const text = String(data.title || data.content || '').replace(/<[^>]*>/g, '').trim();
            const label = (item.type || 'item') + ': ' + (text ? text.slice(0, 60) : item.id);
            return { label, value: item.id };
        });
    }
};
