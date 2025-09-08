'use strict';

module.exports = context => {

    class SlackTaskModel extends context.db.Model {

        static get STATUS_PENDING() { return 'pending'; }
        static get STATUS_REJECTED() { return 'rejected'; }
        static get STATUS_APPROVED() { return 'approved'; }
        static get STATUS_DUE() { return 'due'; }
        static get collection() { return 'slack_tasks'; }
        static get idProperty() { return 'taskId'; }
        static get properties() {
            return [
                'taskId',
                'title',
                'description',
                'status',
                'flowId',
                'approver', // Slack user ID
                'requester', // Slack user ID
                'decisionBy',
                'decisionMade',
                'actor', // Slack user ID who made the decision
                'channel', // Slack channel ID for notifications
                'created',
                'mtime',
                'isApprover'
            ];
        }
    }

    SlackTaskModel.createSettersAndGetters();

    return SlackTaskModel;
};
