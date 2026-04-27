import type { AppmixerContext } from '../../types';

const api = require('../../api.ts');

interface GetPostInput {
    publicationId: string;
    postId: string;
}

module.exports = {
    async receive(context: AppmixerContext): Promise<void> {
        const { publicationId, postId } = context.messages.in.content as GetPostInput;
        const result = await api.Show6.execute(context, { publicationId, postId });
        return context.sendJson(result, 'out');
    }
};
