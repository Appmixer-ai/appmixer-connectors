'use strict';
let ThrottleConfig = { model: null };

module.exports.ThrottleConfig = ThrottleConfig;

module.exports = async context => {

    context.log('info', 'Initializing appmixer.utils.timers plugin.');

    // the plugin will be loaded on all nodes in the cluster. Only one node can perform that init
    const lock = await context.lock('timers-init');

    try {
        const model = require('./ThrottleConfigModel')(context);
        await model.createIndex({ next: 1 });
        ThrottleConfig.model = model;
    } finally {
        lock.unlock();
    }

    context.log('info', 'Loading appmixer.utils.timers API.');
    require('./routes')(context);
    context.log('info', 'Scheduling appmixer.utils.timers jobs.');
    await require('./jobs')(context);

    context.log('info', 'appmixer.utils.timers plugin initialized.');
};

