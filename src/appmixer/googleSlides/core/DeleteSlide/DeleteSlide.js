'use strict';

module.exports = {
    async receive(context) {

        const { presentationId, slideId } = context.messages.in.content;

        if (!presentationId) {
            throw new context.CancelError('Presentation ID is required!');
        }

        if (!slideId) {
            throw new context.CancelError('Slide ID is required!');
        }

        // https://developers.google.com/slides/api/reference/rest/v1/presentations/batchUpdate
        await context.httpRequest({
            method: 'POST',
            url: `https://slides.googleapis.com/v1/presentations/${presentationId}:batchUpdate`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`
            },
            data: {
                requests: [
                    {
                        deleteObject: {
                            objectId: slideId
                        }
                    }
                ]
            }
        });

        return context.sendJson({}, 'out');
    }
};
