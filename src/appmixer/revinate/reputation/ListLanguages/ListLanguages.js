'use strict';

const lib = require('../lib');

module.exports = {

    // Private: the source of the Language dropdowns. Cached, and an error shows an empty dropdown
    // (the slug can still be typed) instead of an error popup.
    async receive(context) {

        try {
            const items = await lib.listLookupCached(context, {
                path: '/languages', source: 'reputation-languages', label: 'the list of languages'
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

        return (items || []).filter(language => language && language.slug).map(language => ({
            label: language.englishName || language.name || language.slug,
            value: language.slug
        }));
    }
};
