'use strict';

const lib = require('../lib');

module.exports = {

    async receive(context) {

        const {
            dealName, subPipeline, stage, amount, closingDate, companyId, contactId, description
        } = context.messages.in.content;

        if (!dealName) {
            throw new context.CancelError('Pipeline Record Name is required!');
        }
        if (!subPipeline) {
            throw new context.CancelError('Sub-Pipeline is required!');
        }
        if (!stage) {
            throw new context.CancelError('Stage is required!');
        }

        const record = {
            Deal_Name: dealName,
            Sub_Pipeline: subPipeline,
            Stage: stage,
            Amount: amount === undefined || amount === '' ? undefined : Number(amount),
            // Closing_Date is a date field (YYYY-MM-DD).
            Closing_Date: closingDate ? String(closingDate).slice(0, 10) : undefined,
            Account_Name: companyId ? { id: String(companyId) } : undefined,
            Contact_Name: contactId ? { id: String(contactId) } : undefined,
            Description: description
        };
        Object.keys(record).forEach(key => (record[key] === undefined || record[key] === '') && delete record[key]);

        const details = await lib.createRecord(context, 'Pipelines', record);
        return context.sendJson(details, 'out');
    }
};
