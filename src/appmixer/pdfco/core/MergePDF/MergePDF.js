'use strict';

module.exports = {
    async receive(context) {

        const { files, name, async } = context.messages.in.content;

        // Prepare request body
        const requestBody = { url: files.ADD.map(f => f.files_item).join(',') };

        if (name) {
            requestBody.name = name;
        }
        if (async === true) {
            requestBody.async = true;
        }
        // https://apidocs.pdf.co/?#pdf-merge
        const { data } = await context.httpRequest({
            method: 'POST',
            url: 'https://api.pdf.co/v1/pdf/merge',
            headers: {
                'x-api-key': context.auth.apiKey,
                'Content-Type': 'application/json'
            },
            data: requestBody
        });
        return context.sendJson(data, 'out');
    }
};
