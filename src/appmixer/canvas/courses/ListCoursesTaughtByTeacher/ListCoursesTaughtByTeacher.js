'use strict';

const Canvas = require('../../canvas-sdk');
module.exports = {

    async receive(context) {

        const { auth } = context;
        const accessToken = auth.accessToken;
        const client = new Canvas(accessToken, context);

        const { teacherId } = context.messages.in.content;
        if (!teacherId) {
            throw new context.CancelError('Teacher ID is required');
        }


        const { data } = await client.listCoursesByUserId(teacherId);

        return context.sendJson({ courses: data }, 'out');
    }
};
