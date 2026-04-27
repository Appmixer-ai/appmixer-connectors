import type { AppmixerContext } from '../../types';

const api = require('../../api.ts');

interface DeletePostInput {
    publicationId: string;
    postId: string;
}

module.exports = {
    async receive(context: AppmixerContext): Promise<void> {
        const { publicationId, postId } = context.messages.in.content as DeletePostInput;
        await api.Delete2.execute(context, { publicationId, postId });
        // DELETE returns 204 No Content, so we echo back the input IDs
        return context.sendJson({ postId, publicationId, deleted: true }, 'out');
    }
};
