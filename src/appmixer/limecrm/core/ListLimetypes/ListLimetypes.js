'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        try {
            const items = await lib.listLimetypes(context, { cached: !!context.properties.isSource });
            return context.sendJson({ items }, 'out');
        } catch (err) {
            if (context.properties.isSource) {
                return context.sendJson({ items: [] }, 'out');
            }
            throw err;
        }
    },

    toSelectArray(msg) {

        const items = (msg && msg.items) || [];
        return items
            .slice()
            .sort((a, b) => String(a.localNameSingular).localeCompare(String(b.localNameSingular)))
            .map(item => ({
                label: item.localNameSingular && item.localNameSingular !== item.name
                    ? item.localNameSingular + ' (' + item.name + ')'
                    : item.name,
                value: item.name
            }));
    }
};
