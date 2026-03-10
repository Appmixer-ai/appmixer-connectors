'use strict';

const api = require('../../api');

module.exports = {
    async receive(context) {
        const { publicationId, email } = context.messages.in.content;

        let result;
        try {
            result = await api.GetByEmail.execute(context, { publicationId, email });
        } catch (err) {
            // Beehiiv returns 404 when subscriber does not exist — route to notFound
            const statusCode = err?.response?.status || err?.status;
            if (statusCode === 404) {
                return context.sendJson({ email }, 'notFound');
            }
            throw err;
        }

        // Also handle cases where API returns 200 but with empty/null data
        if (!result || !result.data || !result.data.id) {
            return context.sendJson({ email }, 'notFound');
        }

        return context.sendJson(result, 'out');
    }
};
