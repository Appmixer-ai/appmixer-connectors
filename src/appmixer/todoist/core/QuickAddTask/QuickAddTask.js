'use strict';

module.exports = {

    async receive(context) {

        const { text, note, reminder, autoReminder } = context.messages.in.content;

        if (!text) {
            throw new context.CancelError('Quick Add Text is required!');
        }

        const params = {
            content: text
        };

        if (note) {
            params.description = note;
        }

        if (reminder) {
            params.due_string = reminder;
        }

        if (autoReminder !== undefined) {
            params.auto_reminder = autoReminder;
        }

        const response = await context.httpRequest({
            method: 'POST',
            url: 'https://api.todoist.com/rest/v2/tasks',
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'Content-Type': 'application/json'
            },
            data: params
        });

        return context.sendJson(response.data, 'out');
    }
};
