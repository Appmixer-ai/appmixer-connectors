'use strict';

const { fhirRequest } = require('../../commons');

module.exports = {
    async receive(context) {

        const { procedureId } = context.messages.in.content;

        if (!procedureId) {
            throw new context.CancelError('Procedure ID is required!');
        }

        const procedure = await fhirRequest(context, { resource: `Procedure/${procedureId}` });

        return context.sendJson(procedure, 'out');
    }
};
