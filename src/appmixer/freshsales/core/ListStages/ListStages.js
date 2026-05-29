'use strict';

module.exports = {

    stagesToSelectArray(stages) {

        if (!Array.isArray(stages)) {
            return [];
        }

        return stages.map(stage => ({
            label: stage.name || `Stage ${stage.id}`,
            value: stage.id
        }));
    },

    async receive(context) {

        // https://developers.freshsales.io/api/#list_all_deal_stages
        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://${context.auth.domain}/api/selector/deal_stages`,
            headers: {
                'Authorization': `Token token=${context.auth.apiKey}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });

        const stages = data.deal_stages || [];

        return context.sendJson(stages, 'out');
    }
};
