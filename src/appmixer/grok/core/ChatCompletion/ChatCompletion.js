
'use strict';

const lib = require('../../lib');
module.exports = {
    async receive(context) {        

        const { model, messages|role, messages|content, messages|name, messages|tool_call_id, temperature, top_p, max_tokens, presence_penalty, frequency_penalty, stop, n, stream, user } = context.messages.in.content;


        // https://docs.x.ai/docs/chat-completions
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
