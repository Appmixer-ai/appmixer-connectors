'use strict';

module.exports = {

    async receive(context) {

        const { name, parentId = '0' } = context.messages.in.content;

        if (!name) {
            throw new context.CancelError('Name is required!');
        }

        try {
            // https://developer.box.com/reference/post-folders/
            const { data } = await context.httpRequest({
                method: 'POST',
                url: 'https://api.box.com/2.0/folders',
                headers: {
                    'Authorization': `Bearer ${context.auth.accessToken}`,
                    'Content-Type': 'application/json'
                },
                data: {
                    name,
                    parent: {
                        id: parentId
                    }
                }
            });

            return context.sendJson(data, 'out');
        } catch (error) {
            if (error.status === 409) {
                throw new context.CancelError('Folder already exists');
            }
            throw error;
        }
    }
};
