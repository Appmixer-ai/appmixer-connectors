'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { workerId, includeManager } = context.messages.in.content;

        if (!workerId) {
            throw new context.CancelError('Worker ID is required!');
        }

        const id = lib.objectId(context, workerId, 'Worker ID');
        const worker = await lib.getOne(context, lib.STAFFING_SERVICE, `/workers/${id}`);
        if (!includeManager) {
            return context.sendJson(worker, 'out');
        }

        // No manager (top of the hierarchy) leaves the property out.
        const manager = await lib.resolveManager(context, worker);
        return context.sendJson(manager ? { ...worker, manager } : worker, 'out');
    }
};
