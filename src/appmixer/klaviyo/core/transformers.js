module.exports = {

    listsToOptions: (lists) => {
        if (!lists.data || !Array.isArray(lists.data)) {
            return { inputs: {} };
        }

        const options = lists.data.map(list => ({
            label: list.attributes.name,
            value: list.id
        }));

        return {
            inputs: {
                listId: {
                    type: 'select',
                    options: options
                }
            }
        };
    },

    metricsToOptions: (metrics) => {
        if (!metrics.data || !Array.isArray(metrics.data)) {
            return { inputs: {} };
        }

        const options = metrics.data.map(metric => ({
            label: metric.attributes.name,
            value: metric.id
        }));

        return {
            inputs: {
                metricId: {
                    type: 'select',
                    options: options
                }
            }
        };
    },

    campaignsToOptions: (campaigns) => {
        if (!campaigns.data || !Array.isArray(campaigns.data)) {
            return { inputs: {} };
        }

        const options = campaigns.data.map(campaign => ({
            label: campaign.attributes.name || campaign.id,
            value: campaign.id
        }));

        return {
            inputs: {
                campaignId: {
                    type: 'select',
                    options: options
                }
            }
        };
    }
};
