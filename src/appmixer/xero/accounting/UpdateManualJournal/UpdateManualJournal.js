'use strict';
const XeroClient = require('../../XeroClient');

module.exports = {

    async receive(context) {

        const {
            tenantId,
            ManualJournalID,
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
        const { ManualJournals } = await xc.request('POST', `/api.xro/2.0/ManualJournals/${ManualJournalID}`, { data });

        return context.sendJson(ManualJournals[0], 'out');
    }
};
