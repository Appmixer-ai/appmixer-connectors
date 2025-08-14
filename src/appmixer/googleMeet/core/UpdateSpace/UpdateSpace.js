
'use strict';

const lib = require('../../lib.generated');
module.exports = {
    async receive(context) {        

        const { name, updateMask, space|spaceType, space|config } = context.messages.in.content;


        // https://developers.google.com/workspace/meet/api/reference/rest/v2/spaces/patch
        const { data } = await context.httpRequest({
            method: 'PATCH',
            url: '/v2/spaces/{name}',
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`
            }
        });
    

return context.sendJson(data, 'out');
    }
};
