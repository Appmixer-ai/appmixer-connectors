'use strict';

module.exports = {

    async tick(context) {

        const { documentId } = context.properties;

        if (!documentId) {
            throw new context.CancelError('Document ID is required!');
        }

        // Fetch document from Google Docs API
        // https://developers.google.com/docs/api/reference/rest/v1/documents/get
        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://docs.googleapis.com/v1/documents/${documentId}`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`
            }
        });

        // Load previously known state
        const state = await context.loadState();
        const lastRevisionId = state.lastRevisionId || null;
        const currentRevisionId = data.revisionId;

        // Check if document has been updated
        if (lastRevisionId && lastRevisionId === currentRevisionId) {
            // No changes since last check
            await context.saveState({ lastRevisionId: currentRevisionId });
            return;
        }

        // Document has been updated or this is the first check
        const document = {
            documentId: data.documentId,
            title: data.title,
            revisionId: data.revisionId,
            updated_at: new Date().toISOString()
        };

        // Send update to output port
        await context.sendJson(document, 'out');

        // Save current state for next tick
        await context.saveState({ lastRevisionId: currentRevisionId });
    }
};
