import type { AppmixerContext } from '../../types';

const api = require('../../api.ts');

interface GetSubscriberInput {
    publicationId: string;
    subscriberId: string;
}

module.exports = {
    async receive(context: AppmixerContext): Promise<void> {
        const { publicationId, subscriberId } = context.messages.in.content as GetSubscriberInput;
        const result = await api.GetById.execute(context, { publicationId, subscriberId });
        return context.sendJson(result, 'out');
    }
};
