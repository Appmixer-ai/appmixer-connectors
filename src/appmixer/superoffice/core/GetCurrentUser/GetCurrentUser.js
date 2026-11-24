'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const principal = await lib.request(context, { path: '/User/currentPrincipal' });

        return context.sendJson({
            associateId: principal.AssociateId,
            personId: principal.PersonId,
            contactId: principal.ContactId,
            fullName: principal.FullName,
            email: principal.EMailAddress,
            userName: principal.UserName,
            roleName: principal.RoleName,
            tenantId: principal.DatabaseContextIdentifier || lib.getTenantId(context)
        }, 'out');
    }
};
