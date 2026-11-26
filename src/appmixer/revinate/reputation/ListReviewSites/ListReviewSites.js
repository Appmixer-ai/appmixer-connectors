'use strict';

const lib = require('../lib');

module.exports = {

    // Private: the source of the Review Site dropdowns. Cached, and an error shows an empty
    // dropdown (the slug can still be typed) instead of an error popup.
    async receive(context) {

        try {
            const items = await lib.listLookupCached(context, {
                path: '/reviewsites', source: 'reputation-review-sites', label: 'the list of review sites'
            });
            return context.sendJson({ items }, 'out');
        } catch (err) {
            if (context.properties.isSource) {
                return context.sendJson({ items: [] }, 'out');
            }
            throw err;
        }
    },

    toSelectArray({ items }) {

        return (items || []).filter(site => site && site.slug).map(site => ({
            label: site.name || site.slug,
            value: site.slug
        }));
    }
};
