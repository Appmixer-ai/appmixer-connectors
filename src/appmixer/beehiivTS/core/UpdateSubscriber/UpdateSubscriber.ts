import type { AppmixerContext } from '../../types';

const api = require('../../api.ts');

interface UpdateSubscriberInput {
    publicationId: string;
    subscriberId: string;
    tier?: string;
}

module.exports = {
    async receive(context: AppmixerContext): Promise<void> {
        const { publicationId, subscriberId, tier } = context.messages.in.content as UpdateSubscriberInput;
        const result = await api.Patch3.execute(context, { publicationId, subscriberId, tier });
        return context.sendJson(result, 'out');
    }
};
