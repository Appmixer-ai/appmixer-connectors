'use strict';

module.exports = {
    async receive(context) {

        const { file, async } = context.messages.in.content;

        const requestBody = { url: file };
        if (async === true) {
            requestBody.async = true;
        }

        // https://apidocs.pdf.co/?#pdf-info
        const { data } = await context.httpRequest({
            method: 'POST',
            url: 'https://api.pdf.co/v1/pdf/info',
            headers: {
                'x-api-key': context.auth.apiKey,
                'Content-Type': 'application/json'
            },
            data: requestBody
        });
        return context.sendJson(data, 'out');
    }
};
