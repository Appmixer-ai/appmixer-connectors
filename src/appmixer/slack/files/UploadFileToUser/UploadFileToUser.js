'use strict';

const { WebClient } = require('@slack/web-api');
const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { userIds, fileId, filename, altTxt, snippetType, initialComment } = context.messages.in.content;
        const ids = lib.normalizeMultiselectInput(userIds, 8, context, 'userIds');

        const web = new WebClient(context.auth.accessToken);
        const { channel } = await web.conversations.open({ users: ids, prevent_creation: true });
        if (!channel || !channel.id) {
            const errorDetails = JSON.stringify({ channel, userIds });
            throw new context.CancelError('Could not open a conversation with a user. Details: ' + errorDetails);
        }

        // Get Appmixer file info
        const fileInfo = await context.getFileInfo(fileId);
        const fileStream = await context.getFileReadStream(fileId);

        const result = await web.filesUploadV2({
            channel_id: channel.id,
            file: fileStream,
            filename: filename || fileInfo.filename,
            initial_comment: initialComment,
            alt_text: altTxt,
            snippet_type: snippetType
        });

        if (!result.ok) {
            throw new Error(result.error);
        }

        if (!result.files[0].ok) {
            throw new Error(result.files[0].error);
        }

        const file = result.files[0].files[0];

        await context.sendJson(file, 'out');
    }
};
