'use strict';

const commons = require('../lib');

module.exports = {

    async receive(context) {

        const { email } = context.messages.in.content;

        // Normalize email to lowercase for a case-insensitive match.
        // Salesforce itself is case-insensitive for the Email field, but sending a
        // lowercase value avoids any edge-case surprises.
        const normalizedEmail = (email || '').trim().toLowerCase();

        const query = [
            'SELECT Id, FirstName, LastName, Email, Phone, AccountId, OwnerId,',
            'CreatedDate, LastModifiedDate',
            'FROM Contact',
            `WHERE Email = '${normalizedEmail.replace(/'/g, "\\'")}'`,
            'ORDER BY LastModifiedDate DESC',
            'LIMIT 1'
        ].join(' ');

        const { data } = await commons.api.salesForceRq(context, {
            action: `query?${new URLSearchParams({ q: query }).toString()}`
        });

        if (!data.records || data.records.length === 0) {
            await context.log({ stage: 'Contact not found', email: normalizedEmail });
            return context.sendJson({ email: normalizedEmail }, 'notFound');
        }

        if (data.records.length > 1 || data.totalSize > 1) {
            await context.log({
                stage: 'Multiple contacts found for email — returning most recently modified',
                email: normalizedEmail,
                totalSize: data.totalSize
            });
        }

        const contact = data.records[0];

        return context.sendJson({
            Id: contact.Id,
            FirstName: contact.FirstName,
            LastName: contact.LastName,
            Email: contact.Email,
            Phone: contact.Phone,
            AccountId: contact.AccountId,
            OwnerId: contact.OwnerId,
            CreatedDate: commons.formatDate(contact.CreatedDate),
            LastModifiedDate: commons.formatDate(contact.LastModifiedDate)
        }, 'out');
    }
};
