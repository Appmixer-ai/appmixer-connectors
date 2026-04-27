import type { AppmixerContext, OutputType, ItemSchema } from '../../types';

const api = require('../../api.ts');
const lib = require('../../lib.ts');

const SCHEMA: ItemSchema = {
    id: { type: 'string', title: 'Post ID' },
    title: { type: 'string', title: 'Title' },
    status: { type: 'string', title: 'Status' },
    web_url: { type: 'string', title: 'Web URL' },
    created: { type: 'integer', title: 'Created' }
};

interface FindPostsInput {
    publicationId: string;
    status?: string;
    audience?: string;
    limit?: number;
    outputType: OutputType;
}

interface FindPostsParams {
    publicationId: string;
    limit?: number;
    status?: string;
    audience?: string;
}

module.exports = {

    async receive(context: AppmixerContext): Promise<void> {

        const { publicationId, status, audience, limit, outputType } = context.messages.in.content as FindPostsInput;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, SCHEMA, { label: 'Posts', value: 'result' });
        }

        if (!publicationId) {
            throw new context.CancelError('Publication ID is required!');
        }

        const params: FindPostsParams = { publicationId, limit };
        if (status && status !== 'all') params.status = status;
        if (audience && audience !== 'all') params.audience = audience;

        const result = await api.Index9.execute(context, params);
        const items: Record<string, unknown>[] = (result as { data?: Record<string, unknown>[] }).data || [];

        if (items.length === 0) {
            return context.sendJson({}, 'notFound');
        }

        return lib.sendArrayOutput({ context, outputType, records: items });
    }
};
