'use strict';
const XeroClient = require('../../XeroClient');

/**
 * Parse Xero's /Date(timestamp+offset)/ format into ISO string.
 * E.g. "/Date(1963612800000+0000)/" → "2032-03-20T00:00:00.000Z"
 */
function xeroDateToISO(xeroDate) {
    if (!xeroDate) return null;
    const match = xeroDate.match(/\/Date\((\d+)([+-]\d{4})?\)\//);
    if (!match) return null;
    return new Date(parseInt(match[1], 10)).toISOString();
}

module.exports = {

    async receive(context) {

        const {
            tenantId,
            Narration,
            Date: date,
            Status,
            LineAmountTypes,
            Url,
            ShowOnCashBasisReports,
            JournalLines
        } = context.messages.in.content;

        let journalLines;
        try {
            journalLines = JSON.parse(JournalLines);
        } catch (e) {
            throw new context.CancelError('Invalid JSON in Journal Lines. Expected a JSON array of line objects.');
        }

        const manualJournal = {
            Narration,
            JournalLines: journalLines
        };

        if (date) manualJournal.Date = date;
        if (Status) manualJournal.Status = Status;
        if (LineAmountTypes) manualJournal.LineAmountTypes = LineAmountTypes;
        if (Url) manualJournal.Url = Url;
        if (ShowOnCashBasisReports !== undefined && ShowOnCashBasisReports !== null) {
            manualJournal.ShowOnCashBasisReports = ShowOnCashBasisReports;
        }

        const data = {
            ManualJournals: [manualJournal]
        };

        const xc = new XeroClient(context, tenantId);
        const { ManualJournals } = await xc.request('PUT', '/api.xro/2.0/ManualJournals', { data });

        const result = ManualJournals[0];
        // Xero ManualJournals API doesn't return DateString (unlike Invoices), so we parse it.
        if (result.Date) {
            result.DateString = xeroDateToISO(result.Date);
        }
        if (result.UpdatedDateUTC) {
            result.UpdatedDateUTCString = xeroDateToISO(result.UpdatedDateUTC);
        }

        return context.sendJson(result, 'out');
    }
};
