'use strict';

module.exports = {
    async receive(context) {

        const { file } = context.messages.in.content;

        const requestBody = { url: file };

        // https://apidocs.pdf.co/?#pdf-info
        const { data } = await context.httpRequest({
            method: 'POST',
            url: 'https://api.pdf.co/v1/pdf/info',
            headers: {
                'x-api-key': context.apiKey,
                'Content-Type': 'application/json'
            },
            data: requestBody
        });
        return context.sendJson(data, 'out');
    }
};
