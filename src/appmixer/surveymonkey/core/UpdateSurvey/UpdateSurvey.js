'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { surveyId, title, nickname, language, folderId } = context.messages.in.content;

        if (!surveyId) {
            throw new context.CancelError('Survey is required!');
        }

        const data = {};
        if (title) {
            data.title = title;
        }
        if (nickname) {
            data.nickname = nickname;
        }
        if (language) {
            data.language = language;
        }
        if (folderId) {
            data.folder_id = String(folderId);
        }
        if (!Object.keys(data).length) {
            throw new context.CancelError('Set at least one field to update.');
        }

        await lib.request(context, { method: 'PATCH', path: '/surveys/' + lib.encodeId(surveyId), data });
        return context.sendJson({}, 'out');
    }
};
