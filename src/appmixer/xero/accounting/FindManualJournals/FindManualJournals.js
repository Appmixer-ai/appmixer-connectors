'use strict';
const { sendArrayOutput } = require('../../commons');
const XeroClient = require('../../XeroClient');

const outputPortName = 'out';

module.exports = {

    async receive(context) {

        const generateOutputPortOptions = context.properties.generateOutputPortOptions;
        const { tenantId, Status, outputType } = context.messages.in.content;

        if (generateOutputPortOptions) {
            return this.getOutputPortOptions(context, outputType);
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

        return sendArrayOutput({
            context,
            outputPortName,
            outputType,
            records
        });
    },

    getOutputPortOptions(context, outputType) {

        const itemSchema = [
            { label: 'Manual Journal ID', value: 'ManualJournalID' },
            { label: 'Narration', value: 'Narration' },
            { label: 'Date', value: 'Date' },
            { label: 'Status', value: 'Status' },
            { label: 'Line Amount Types', value: 'LineAmountTypes' },
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
            { label: 'Url', value: 'Url' },
            { label: 'Show On Cash Basis Reports', value: 'ShowOnCashBasisReports' },
            { label: 'Has Attachments', value: 'HasAttachments' },
            { label: 'Updated Date UTC', value: 'UpdatedDateUTC' }
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
                                UpdatedDateUTC: { type: 'string', title: 'UpdatedDateUTC' }
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
