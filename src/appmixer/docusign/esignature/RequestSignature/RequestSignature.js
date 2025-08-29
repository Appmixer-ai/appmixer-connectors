'use strict';
const commons = require('../../lib');

/**
 * Get an envelope.
 * @extends {Component}
 */
module.exports = {

    async receive(context) {

        if (context.messages.webhook) {
            await context.sendJson(context.messages.webhook.content.data, 'completed');
            return context.response({});
        }
        const envelopeArgs = context.messages.in.content;
        let docs = envelopeArgs.documents.AND;
        for (const doc of docs) {
            doc.doc = await context.loadFile(doc.document);
            let fileInfo = await context.getFileInfo(doc.document);
            doc.fileName = fileInfo?.filename.split('.')[0];
        }
        const { base_uri: basePath, account_id: accountId } = context.profileInfo.accounts[0];
        let args = {
            basePath,
            accountId,
            envelopeArgs,
            docs
        };
        const envelope = await commons.requestSignature(args, context.auth.accessToken, context.getWebhookUrl());
        return context.sendJson(envelope, 'out');
    }
};
