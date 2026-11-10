'use strict';

module.exports = async context => {

    context.log('info', '[UTILS.SUBFLOWS] Initializing SUBFLOWS plugin.');
    // The plugin will be loaded on all nodes in the cluster. Only one node can perform this init.
    const lock = await context.lock('utils-subflows-init');
    try {
        const CallModel = require('./CallModel')(context);
        await CallModel.createIndex({ id: 1 });
        await CallModel.createIndex({ expiresAt: 1 });
    } finally {
        lock.unlock();
    }
    require('./routes')(context);
    context.log('info', '[UTILS.SUBFLOWS] Scheduling jobs.');
    await require('./jobs')(context);
    context.log('info', '[UTILS.SUBFLOWS] SUBFLOWS plugin initialized.');
};
