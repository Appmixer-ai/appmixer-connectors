import type { AppmixerContext, OutputType, ItemSchema } from '../../types';

const api = require('../../api.ts');
const lib = require('../../lib.ts');

const SCHEMA: ItemSchema = {
    id: { type: 'string', title: 'Subscriber ID' },
    email: { type: 'string', title: 'Email' },
    status: { type: 'string', title: 'Status' },
    subscription_tier: { type: 'string', title: 'Tier' },
    referral_code: { type: 'string', title: 'Referral Code' },
    created: { type: 'integer', title: 'Created' }
};

interface FindSubscribersInput {
    publicationId: string;
    status?: string;
    tier?: string;
    limit?: number;
    outputType: OutputType;
}

interface FindSubscribersParams {
    publicationId: string;
    limit?: number;
    status?: string;
    tier?: string;
}

module.exports = {

    async receive(context: AppmixerContext): Promise<void> {

        const { publicationId, status, tier, limit, outputType } = context.messages.in.content as FindSubscribersInput;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, SCHEMA, { label: 'Subscribers', value: 'result' });
        }

        if (!publicationId) {
            throw new context.CancelError('Publication ID is required!');
        }

        const params: FindSubscribersParams = { publicationId, limit };
        if (status && status !== 'all') params.status = status;
        if (tier && tier !== 'all') params.tier = tier;

        const result = await api.Index5.execute(context, params);
        const items: Record<string, unknown>[] = (result as { data?: Record<string, unknown>[] }).data || [];

        if (items.length === 0) {
            return context.sendJson({}, 'notFound');
        }

        return lib.sendArrayOutput({ context, outputType, records: items });
    }
};
