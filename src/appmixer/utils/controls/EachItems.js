'use strict';

module.exports = context => {

    class EachItems extends context.db.Model {

        static get collection() {

            return 'each_items';
        }

        static get idProperty() {

            return 'id';
        }

        static get properties() {

            return [
                'id',
                'items',
                'delay',
                'correlationId',
                'count'
            ];
        }
    }

    EachItems.createSettersAndGetters();

    return EachItems;
};

