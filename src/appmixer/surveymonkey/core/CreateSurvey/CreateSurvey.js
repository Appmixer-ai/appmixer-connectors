'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { title, nickname, language, folderId, fromSurveyId, fromTemplateId } = context.messages.in.content;

        if (fromSurveyId && fromTemplateId) {
            throw new context.CancelError('Use either Copy From Survey or Copy From Template ID, not both.');
        }

        const data = {};
        if (title) {
            data.title = title;
        }
        if (fromSurveyId) {
            data.from_survey_id = String(fromSurveyId);
        } else if (fromTemplateId) {
            data.from_template_id = String(fromTemplateId);
        } else {
            if (nickname) {
                data.nickname = nickname;
            }
            if (language) {
                data.language = language;
            }
            if (folderId) {
                data.folder_id = String(folderId);
            }
        }

        const survey = await lib.request(context, { method: 'POST', path: '/surveys', data });
        return context.sendJson(survey, 'out');
    }
};
