import type { AppmixerContext } from '../../types';

const api = require('../../api.ts');

interface DeleteSubscriberInput {
    publicationId: string;
    subscriberId: string;
}

module.exports = {
    async receive(context: AppmixerContext): Promise<void> {
        const { publicationId, subscriberId } = context.messages.in.content as DeleteSubscriberInput;
        await api.Delete4.execute(context, { publicationId, subscriberId });
        return context.sendJson({ subscriberId }, 'out');
    }
};
