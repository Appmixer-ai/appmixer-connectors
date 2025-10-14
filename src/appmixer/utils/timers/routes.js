'use strict';

module.exports = (context) => {

    const ThrottleConfig = require('./ThrottleConfigModel')(context);

    context.http.router.register({
        method: 'PATCH',
        path: '/throttle-configs',
        options: {
            async handler(req) {

                const user = await context.http.auth.getUser(req);
                const userId = user.getId();

                const {
                    messageQueue,
                    name,
                    interval,
                    maxPerInterval,
                    strategy,
                    spacing,
                    minPerSpace,
                    maxPerSpace,
                    timeSlots,
                    start
                } = req.payload;
                const configModel = await ThrottleConfig.findOne({ userId, name }) || new ThrottleConfig();

                const queues = configModel.queues || [];
                const set = new Set(queues);
                set.add(messageQueue);

                // For shared configs replace the queues property for Array.from(set)
                configModel.populate({
                    userId,
                    name,
                    interval,
                    maxPerInterval,
                    strategy,
                    spacing,
                    minPerSpace,
                    maxPerSpace,
                    timeSlots,
                    queues: [messageQueue]
                });

                if (start) {
                    configModel.start = new Date(start);
                }

                if (!configModel.next) {
                    configModel.next = new Date();
                }

                await configModel.save();

                return configModel;
            },
            validate: {
                payload: context.http.Joi.object({
                    name: context.http.Joi.string().required(),
                    maxPerInterval: context.http.Joi.number().optional(),
                    interval: context.http.Joi.number().optional(),
                    messageQueue: context.http.Joi.string().optional(),
                    strategy: context.http.Joi.string().optional(),
                    spacing: context.http.Joi.number().optional(),
                    minPerSpace: context.http.Joi.number().optional(),
                    maxPerSpace: context.http.Joi.number().optional(),
                    timeSlots: context.http.Joi.any().optional(),
                    start: context.http.Joi.date().optional()
                })
            }
        }
    });

    context.http.router.register({
        method: 'DELETE',
        path: '/throttle-configs',
        options: {
            async handler(req) {

                const user = await context.http.auth.getUser(req);
                const userId = user.getId();

                const { name } = req.payload;
                return context.db.collection('throttleConfigs').deleteOne({ userId, name });
            },
            validate: {
                payload: context.http.Joi.object({
                    name: context.http.Joi.string().required()
                })
            }
        }
    });
};
