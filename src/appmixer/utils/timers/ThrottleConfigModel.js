'use strict';

module.exports = context => {

    class ThrottlerConfig extends context.db.Model {

        static get collection() {

            return 'throttleConfigs';
        }

        static get idProperty() {

            return 'name';
        }

        static get properties() {

            return [
                'userId',
                'name',
                'interval',
                'maxPerInterval',
                'strategy',
                'spacing',
                'minPerSpace',
                'maxPerSpace',
                'timeSlots',
                'start',
                'counter',
                'queues',
                'next'
            ];
        }
    }

    ThrottlerConfig.createSettersAndGetters();

    return ThrottlerConfig;
};

