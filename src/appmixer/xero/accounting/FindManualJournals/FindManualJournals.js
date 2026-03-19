'use strict';
const { sendArrayOutput } = require('../../commons');
const XeroClient = require('../../XeroClient');

const outputPortName = 'out';

/**
 * Parse Xero's /Date(timestamp+offset)/ format into ISO string.
 */
function xeroDateToISO(xeroDate) {
    if (!xeroDate) return null;
    const match = xeroDate.match(/\/Date\((\d+)([+-]\d{4})?\)\//);
    if (!match) return null;
    return new Date(parseInt(match[1], 10)).toISOString();
}

module.exports = {

    async receive(context) {

        const generateOutputPortOptions = context.properties.generateOutputPortOptions;
        const { tenantId, Status, outputType } = context.messages.in.content;

        if (generateOutputPortOptions) {
            return this.getOutputPortOptions(context, outputType);
        }

        if (!tenantId) {
            throw new context.CancelError('Tenant ID is required.');
        }

        const params = {};
        if (Status) {
            params.where = `Status=="${Status}"`;
        }

        const xc = new XeroClient(context, tenantId);
        const records = await xc.requestPaginated('GET', '/api.xro/2.0/ManualJournals', {
            dataKey: 'ManualJournals',
            params
        });

        if (!records || records.length === 0) {
            return context.sendJson({}, 'notFound');
        }

        // Xero ManualJournals API doesn't return DateString, so we parse it.
        for (const record of records) {
            if (record.Date) {
                record.DateString = xeroDateToISO(record.Date);
            }
            if (record.UpdatedDateUTC) {
                record.UpdatedDateUTCString = xeroDateToISO(record.UpdatedDateUTC);
            }
        }

        return sendArrayOutput({
            context,
            outputPortName,
            outputType,
            records
        });
    },

    getOutputPortOptions(context, outputType) {

        const itemSchema = [
            { label: 'Manual Journal ID', value: 'ManualJournalID', schema: { type: 'string' } },
            { label: 'Narration', value: 'Narration', schema: { type: 'string' } },
            { label: 'Date', value: 'Date', schema: { type: 'string' } },
            { label: 'Date String', value: 'DateString', schema: { type: 'string' } },
            { label: 'Status', value: 'Status', schema: { type: 'string' } },
            { label: 'Line Amount Types', value: 'LineAmountTypes', schema: { type: 'string' } },
            {
                label: 'Journal Lines', value: 'JournalLines', schema: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            LineAmount: { type: 'number', title: 'LineAmount' },
                            AccountCode: { type: 'string', title: 'AccountCode' },
                            AccountID: { type: 'string', title: 'AccountID' },
                            Description: { type: 'string', title: 'Description' },
                            TaxType: { type: 'string', title: 'TaxType' },
                            TaxAmount: { type: 'number', title: 'TaxAmount' },
                            IsBlank: { type: 'boolean', title: 'IsBlank' }
                        }
                    }
                }
            },
            { label: 'Url', value: 'Url', schema: { type: 'string' } },
            { label: 'Show On Cash Basis Reports', value: 'ShowOnCashBasisReports', schema: { type: 'boolean' } },
            { label: 'Has Attachments', value: 'HasAttachments', schema: { type: 'boolean' } },
            { label: 'Updated Date UTC', value: 'UpdatedDateUTC', schema: { type: 'string' } },
            { label: 'Updated Date UTC String', value: 'UpdatedDateUTCString', schema: { type: 'string' } }
        ];

        if (outputType === 'item') {
            return context.sendJson(itemSchema, outputPortName);
        } else if (outputType === 'items') {
            return context.sendJson(
                [{
                    label: 'Manual Journals',
                    value: 'items',
                    schema: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                ManualJournalID: { type: 'string', title: 'ManualJournalID' },
                                Narration: { type: 'string', title: 'Narration' },
                                Date: { type: 'string', title: 'Date' },
                                DateString: { type: 'string', title: 'DateString' },
                                Status: { type: 'string', title: 'Status' },
                                LineAmountTypes: { type: 'string', title: 'LineAmountTypes' },
                                JournalLines: {
                                    title: 'JournalLines',
                                    type: 'array',
                                    items: {
                                        type: 'object',
                                        properties: {
                                            LineAmount: { type: 'number', title: 'LineAmount' },
                                            AccountCode: { type: 'string', title: 'AccountCode' },
                                            AccountID: { type: 'string', title: 'AccountID' },
                                            Description: { type: 'string', title: 'Description' },
                                            TaxType: { type: 'string', title: 'TaxType' },
                                            TaxAmount: { type: 'number', title: 'TaxAmount' },
                                            IsBlank: { type: 'boolean', title: 'IsBlank' }
                                        }
                                    }
                                },
                                Url: { type: 'string', title: 'Url' },
                                ShowOnCashBasisReports: { type: 'boolean', title: 'ShowOnCashBasisReports' },
                                HasAttachments: { type: 'boolean', title: 'HasAttachments' },
                                UpdatedDateUTC: { type: 'string', title: 'UpdatedDateUTC' },
                                UpdatedDateUTCString: { type: 'string', title: 'UpdatedDateUTCString' }
                            }
                        }
                    }
                }],
                outputPortName
            );
        } else {
            // file
            return context.sendJson([{ label: 'File ID', value: 'fileId' }], outputPortName);
        }
    }
};
