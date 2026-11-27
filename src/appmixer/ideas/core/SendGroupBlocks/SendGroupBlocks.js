'use strict';

const lib = require('../../lib');

// Send group blocks (group masters with their daily room blocks and pickup) of the connected property to IDeaS RMS: POST /api/public/v1/groups.
// The processing result comes back later on the plugin route (routes.js) and is sent on to "done";
// see lib.submit() and lib.receiveReply().
module.exports = {

    async receive(context) {

        if (context.messages.webhook) {
            return lib.receiveReply(context, 'groups');
        }
        if (lib.isEmpty(context.messages.in.content.groups)) {
            throw new context.CancelError('Group Blocks is required!');
        }
        const result = await lib.submit(context, 'groups');
        return context.sendJson(result, 'out');
    }
};
