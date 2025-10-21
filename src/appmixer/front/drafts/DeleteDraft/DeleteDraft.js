module.exports = {

    async receive(context) {

        const { draftId, version } = context.messages.in.content;

        if (!draftId) {
            throw new context.CancelError('Draft ID is required!');
        }

        if (!version) {
            throw new context.CancelError('Version is required!');
        }

        await context.httpRequest({
            method: 'DELETE',
            url: `https://api2.frontapp.com/drafts/${draftId}`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'Accept': 'application/json'
            },
            data: { version }
        });

        return context.sendJson({}, 'out');


    }
};
