/* eslint-disable no-underscore-dangle */
'use strict';

const Promise = require('bluebird');
const moment = require('moment');
const cronParser = require('cron-parser');

async function getCursorValue(context, queueId) {

    const result = await context.db.coreCollection('storeData').findOne({ storeId: context.db.ObjectID(queueId) });
    return result ? result._id : null;
}

function canProcessMessages(strategy, slots = []) {

    if (strategy === 'asap' || !slots.length) {
        return true;
    }

    for (const slot of slots) {
        const isInSlot = currentTimeInSlot(slot);
        if (isInSlot) {
            return true;
        }
    }
    return false;
}

function currentTimeInSlot(slot) {

    const {
        timeFrom,
        timeTo,
        days = [],
        months = []
    } = slot;

    const now = new Date();
    const compareDate = new Date();

    if (months.length && !months.includes(now.getMonth())) {
        return false;
    }

    if (days.length && !days.includes(now.getDay())) {
        return false;
    }

    if (timeFrom) {
        const [hour, minutes] = timeFrom.split(':');
        compareDate.setHours(hour);
        compareDate.setMinutes(minutes);
        if (now < compareDate) {
            return false;
        }
    }

    if (timeTo) {
        const [hour, minutes] = timeTo.split(':');
        compareDate.setHours(hour);
        compareDate.setMinutes(minutes);
        if (now > compareDate) {
            return false;
        }
    }

    return true;
}

function* createRoundRobin(queues) {

    let j = 0;
    while (true) {
        yield queues[j];
        j++;
        if (j === queues.length) {
            j = 0;
        }
    }
}

async function processMessages(context, strategy, queues, intervalConfig, spacingConfig) {

    const {
        spacing,
        maxPerSpace,
        minPerSpace = 0
    } = spacingConfig;

    const {
        interval,
        maxPerInterval
    } = intervalConfig;

    const queuesExhausted = [];
    const queueIds = Object.keys(queues);

    async function processNextMessage(roundRobin) {

        const queueId = roundRobin.next().value;

        // There are no messages in any queue
        if (queuesExhausted.length === queueIds.length) {
            return { result: 'No more messages' };
        }

        if (queuesExhausted.includes(queueId)) {
            return { result: 'Queue exhausted' };
        }

        const cursor = queues[queueId];

        if (!cursor) {
            queuesExhausted.push(queueId);
            return { result: 'Cursor exhausted' };
        }

        let message;
        let messageLock;
        try {
            message = await context.db.coreCollection('storeData').findOne({ _id: context.db.ObjectID(cursor) });
            if (message) {
                messageLock = await context.lock(`ThrottleMsg-${message._id.toString()}`);
            }
        } catch (err) {
            if (err.message === 'locked') {
                // Means this message is already been processed, so we return and will move on to the next
                return;
            } else {
                throw err;
            }
        }

        // eslint-disable-next-line no-unused-vars
        const { flowId, componentId, content, webhookUrl, correlationId } = message.value;
        try {
            await context.httpRequest.post(webhookUrl, content);
        } catch (err) {
            const axiosErrRes = err.response?.data?.message || '';
            // Component was not found in flow, throttler was removed, just continue
            if (axiosErrRes.includes('not found in flow')) {
                await context.db.coreCollection('storeData').deleteOne({ _id: context.db.ObjectID(message._id) });
                queues[queueId] = await getCursorValue(context, queueId);
                throw new Error('Component not found');
            } else {
                throw err;
            }
        } finally {
            if (messageLock) {
                messageLock.unlock();
            }
        }

        await context.db.coreCollection('storeData').deleteOne({ _id: context.db.ObjectID(message._id) });
        queues[queueId] = await getCursorValue(context, queueId);

        return { result: 'ok' };
    }

    async function processQueues(queueIds, limit) {

        let count = 0;
        const roundRobin = createRoundRobin(queueIds);

        while (count < limit) {
            try {
                const { result } = await processNextMessage(roundRobin);
                if (result === 'No more messages') {
                    break;
                } else if (result === 'Queue exhausted' || result === 'Cursor exhausted') {
                    continue;
                }
            } catch (err) {
                if (err.message.includes('Component not found')) {
                    count--; //Don't count this towards the count
                    continue;
                } else {
                    await context.log('error', 'Throttler message processing failed', err);
                }
            }
            count++;
        }
    }

    if (strategy === 'asap') {
        const queueIds = Object.keys(queues);
        await processQueues(queueIds, maxPerInterval);
    } else { // Spaced output
        const nSlots = spacing ? Math.floor((interval * 60) / spacing) : 1;
        let perSlot = maxPerSpace ? maxPerSpace : Math.ceil(maxPerInterval / nSlots);
        for (let i = 0; i < nSlots; i++) {
            const queueIds = Object.keys(queues);
            const availableMsgs = await countAvailableMsgs(context, queueIds);
            if (availableMsgs >= minPerSpace) {
                await processQueues(queueIds, perSlot);

                if (spacing) {
                    await new Promise(r => setTimeout(r, spacing * 1000));
                }
            }
        }
    }
}

function countAvailableMsgs(context, queues) {

    const objectIds = queues.map(q => context.db.ObjectID(q));
    return context.db.coreCollection('storeData').countDocuments({ storeId: { $in: objectIds } });
}

module.exports = async context => {

    const config = require('./config')(context);
    const ThrottleConfig = require('./ThrottleConfigModel')(context);

    await context.scheduleJob('throttler', config.throttlerJob.schedule, async () => {

        //let lock;
        try {
            //lock = await context.lock('throttle');

            const cronInterval = cronParser.parseExpression(config.throttlerJob.schedule);
            const queryDue = moment(cronInterval.next().toDate());
            const dueConfigs = await ThrottleConfig.find({
                '$and': [
                    { next: { $lt: queryDue.toDate() } },
                    {
                        '$or': [
                            { start: { $exists: false } },
                            { start: { $lte: new Date() } }
                        ]
                    }
                ]
            });

            await Promise.map(dueConfigs, async config => {

                let diff = moment(config.next).diff(moment(), 'seconds') * 1000;
                diff = diff > 0 ? diff : 0;

                try {
                    const newDue = moment().add(config.interval, 'minutes').toDate();
                    config.setNext(newDue);
                    await config.save();

                    return await new Promise((resolve, reject) => {
                        setTimeout(async () => {
                            try {
                                if (canProcessMessages(config.timeSlots)) {
                                    const strategy = config.strategy;
                                    const queueCursors = await Promise.map(config.queues, queue => {
                                        return getCursorValue(context, queue);
                                    });

                                    const queues = {};
                                    for (let i = 0; i < config.queues.length; i++) {
                                        queues[config.queues[i]] = queueCursors[i];
                                    }

                                    const intervalConfig = {
                                        interval: config.interval,
                                        maxPerInterval: config.maxPerInterval
                                    };
                                    const spacingConfig = {
                                        spacing: config.spacing,
                                        minPerSpace: config.minPerSpace,
                                        maxPerSpace: config.maxPerSpace
                                    };
                                    await processMessages(context, strategy, queues, intervalConfig, spacingConfig);
                                }
                                resolve();
                            } catch (err) {
                                reject(err);
                            }
                        }, diff);
                    });
                } catch (err) {
                    // Don't break the promise chain and log the error
                    context.log('error', `Error processing throttle config: ${config.name}`, context.utils.Error.stringify(err));
                }
            });
        } catch (err) {
            if (err.message !== 'locked') {
                context.log('error', 'Error processing throttle messages', context.utils.Error.stringify(err));
            }
        }
    });
};
