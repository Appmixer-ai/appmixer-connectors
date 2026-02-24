'use strict';
const Hubspot = require('../../Hubspot');

module.exports = {

    async receive(context) {

        const {
            companyId
        } = context.messages.in.content;

        if (!companyId) {
            throw new context.CancelError('Company ID is required!');
        }

        const { auth } = context;
        const hs = new Hubspot(auth.accessToken, context.config);

        await hs.call('delete', `crm/v3/objects/companies/${companyId}`);

        return context.sendJson({ companyId }, 'out');
    }
};
