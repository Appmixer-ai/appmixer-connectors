'use strict';

// One record per CallFlow call: maps the short correlation ID passed to the called flow
// to the webhook URL of the calling CallFlow component. The webhook URL never leaves the server.
module.exports = context => {

    class CallModel extends context.db.Model {

        static get collection() {

            return 'subflows_calls';
        }

        static get idProperty() {

            return 'id';
        }

        static get properties() {

            return [
                'id',
                'callerWebhookUrl',
                'calleeFlowId',
                'calleeComponentId',
                'createdAt',
                'expiresAt'
            ];
        }
    }

    CallModel.createSettersAndGetters();

    return CallModel;
};
