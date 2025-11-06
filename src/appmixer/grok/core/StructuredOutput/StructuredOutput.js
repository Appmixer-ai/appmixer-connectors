
'use strict';

const lib = require('../../lib');
module.exports = {
    async receive(context) {        

        const { model, messages|role, messages|content, response_format|type, response_format|json_schema, response_format|strict, max_tokens } = context.messages.in.content;


        // https://docs.x.ai/docs/structured-outputs
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
