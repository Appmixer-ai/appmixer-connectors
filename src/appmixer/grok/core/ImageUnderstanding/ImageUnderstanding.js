
'use strict';

const lib = require('../../lib');
module.exports = {
    async receive(context) {        

        const { model, messages|role, messages|content|type, messages|content|text, messages|content|image_url|url, messages|content|image_url|detail, max_tokens } = context.messages.in.content;


        // https://docs.x.ai/docs/vision
        const { data } = await context.httpRequest({
            method: 'POST',
            url: 'https://api.x.ai/v1/https://api.x.ai/v1/chat/completions',
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`
            }
        });
    

return context.sendJson(data, 'out');
    }
};
