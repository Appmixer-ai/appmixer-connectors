'use strict';
const commons = require('../lib');

module.exports = {

    async start(context) {

        const targetStage = context.properties.stageName;

        const soql = `SELECT Id,StageName FROM Opportunity WHERE StageName != '${targetStage.replace(/'/g, '\\\'')}'`;
        const { data } = await commons.api.salesForceRq(context, {
            method: 'GET',
            action: `query?q=${encodeURIComponent(soql)}`
        });

        let knownStages = {};
        if (data && data.records) {
            data.records.forEach(opportunity => { knownStages[opportunity['Id']] = opportunity['StageName']; });
        }
        await context.saveState({ knownStages });
    },

    async tick(context) {
        let since = new Date();
        const targetStage = context.properties.stageName;

        const lastSince = context.state.since || since;

        const soql = `SELECT FIELDS(ALL) FROM Opportunity WHERE LastModifiedDate >= ${commons.Date.toDateTimeLiteral(lastSince)} LIMIT 200`;
        const { data } = await commons.api.salesForceRq(context, {
            action: `query?q=${encodeURIComponent(soql)}`,
            method: 'GET'
        });

        let res = (data && data.records) ? data.records : [];
        let knownStages = context.state.knownStages || {};

        let newKnownStages = { ...knownStages };

        let triggered = [];
        if (res.length && targetStage) {
            res.forEach(opportunity => {
                const id = opportunity['Id'];
                const prevStage = knownStages[id];
                const currStage = opportunity['StageName'];

                // Only trigger if stage changed to targetStage
                if (currStage === targetStage && prevStage !== targetStage) {
                    triggered.push(opportunity);
                }
                // Update known stage
                newKnownStages[id] = currStage;
            });
        }
        await Promise.all(triggered.map(opportunity => {
            let dates = [
                'CloseDate',
                'CreatedDate',
                'LastModifiedDate',
                'LastViewedDate',
                'LastReferencedDate',
                'SystemModstamp'
            ];
            opportunity = commons.formatFields(opportunity, dates, commons.formatDate);
            return context.sendJson(opportunity, 'opportunity');
        }));
        await context.saveState({ knownStages: newKnownStages, since });
    }
};
