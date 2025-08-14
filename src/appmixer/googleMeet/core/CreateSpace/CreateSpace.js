
'use strict';

const lib = require('../../lib.generated');
module.exports = {
    async receive(context) {        

        const { space|spaceType, space|config } = context.messages.in.content;


        // https://developers.google.com/workspace/meet/api/reference/rest/v2/spaces/create
        const { data } = await context.httpRequest({
            method: 'POST',
            url: '/v2/spaces',
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`
            }
        });
    

return context.sendJson(data, 'out');
    }
};
