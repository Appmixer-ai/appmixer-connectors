'use strict';
const commons = require('../../docusign-commons');
const { normalizeMultiselect } = require('../../lib');

/**
 * Get an envelope.
 * @extends {Component}
 */
module.exports = {

    async receive(context) {

        const { envelopeId, include } = context.messages.in.content;

        // Normalize the multiselect field
        const normalizedInclude = normalizeMultiselect(include);

        const { base_uri: basePath, account_id: accountId } = context.profileInfo.accounts[0];
        let args = {
            basePath,
            envelopeId,
            accountId,
            include: normalizedInclude
        };

        const envelope = await commons.getEnvelope(args, context.auth.accessToken);

        return context.sendJson(envelope, 'out');
    }
};
