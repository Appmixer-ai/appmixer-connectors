import type { AppmixerContext } from '../../types';

const api = require('../../api.ts');

interface GetSubscriberByEmailInput {
    publicationId: string;
    email: string;
}

module.exports = {
    async receive(context: AppmixerContext): Promise<void> {
        const { publicationId, email } = context.messages.in.content as GetSubscriberByEmailInput;

        let result: unknown;
        try {
            result = await api.GetByEmail.execute(context, { publicationId, email });
        } catch (err) {
            // Beehiiv returns 404 when subscriber does not exist — route to notFound
            const statusCode = (err as { response?: { status?: number }; status?: number })?.response?.status
                || (err as { status?: number })?.status;
            if (statusCode === 404) {
                return context.sendJson({ email }, 'notFound');
            }
            throw err;
        }

        // Also handle cases where API returns 200 but with empty/null data
        const data = (result as { data?: { id?: string } })?.data;
        if (!result || !data || !data.id) {
            return context.sendJson({ email }, 'notFound');
        }

        return context.sendJson(result, 'out');
    }
};
