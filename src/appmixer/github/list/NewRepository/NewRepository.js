'use strict';
const lib = require('../../lib');

/**
 * Component which triggers whenever new repo is created
 * @extends {Component}
 */
module.exports = {
    async tick(context) {

        const res = await lib.apiRequest(context, 'user/repos');

        let known = Array.isArray(context.state.known) ? new Set(context.state.known) : null;

        const { diff, actual } = lib.getNewItems(known, res.data, 'id');

        if (diff.length) {
            await Promise.all(diff.map(repo => {
                return context.sendJson(repo, 'out');

            }));
        }

        await context.saveState({ known: actual });
    }
};
