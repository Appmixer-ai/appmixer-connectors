'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const input = context.messages.in.content;
        const { title, text, date } = input;

        if (!title) {
            throw new context.CancelError('Title is required!');
        }
        if (!input.companyId && !input.personId && !input.ticketId && !input.projectId && !input.saleId) {
            throw new context.CancelError('Link the note to a company, person, ticket, project or sale.');
        }

        // SuperOffice has no separate note entity: feedback is kept as a completed task, which
        // shows in the activity history of the linked records.
        const when = date || new Date().toISOString();
        const record = await lib.createActivity(context, {
            ...input,
            description: text,
            startDate: when,
            endDate: when
        }, { type: 'inChecklist', completed: 'Completed' });
        return context.sendJson(record, 'out');
    }
};
