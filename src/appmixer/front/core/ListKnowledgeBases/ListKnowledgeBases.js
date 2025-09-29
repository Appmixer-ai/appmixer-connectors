const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { limit, outputType = 'array' } = context.messages.in.content;

        try {
            const url = 'https://api2.frontapp.com/knowledge_bases';

            const params = {};
            if (limit) {
                params.limit = limit;
            }

            const response = await context.httpRequest({
                method: 'GET',
                url,
                params,
                headers: {
                    'Authorization': `Bearer ${context.auth.accessToken}`,
                    'Accept': 'application/json'
                }
            });

            const knowledgeBases = response.data._results || [];

            return lib.sendArrayOutput({
                context,
                outputPortName: 'out',
                result: knowledgeBases,
                outputType
            });

        } catch (error) {
            throw error;
        }
    }
};
