const lib = require('../lib');
const moment = require('moment');

function isNewFileOrFolder(change) {

    const file = change.file;
    if (!file) return false;

    if (change.changeType !== 'file') return false;
    if (change.removed) return false;
    if (file.trashed) return false;

    const created = new Date(file.createdTime).getTime();
    const modified = new Date(file.modifiedTime).getTime();
    const viewed = file.viewedByMeTime ? new Date(file.viewedByMeTime).getTime() : 0;

    if (isNaN(created) || isNaN(modified)) return false;

    return created >= modified && created >= viewed;
}

module.exports = {

    isNewFileOrFolder,

    async start(context) {

        return lib.registerWebhook(context);
    },

    stop(context) {

        return lib.unregisterWebhook(context);
    },

    async receive(context) {

        if (!context.messages.webhook) {
            return;
        }

        if (context.messages.webhook.content.headers['x-goog-resource-state'] === 'sync') {
            // sync messages can be ignored
            return context.response();
        }

        await lib.checkMonitoredFiles(context, { filter: isNewFileOrFolder });

        return context.response();
    },

    async tick(context) {

        const { expiration, hasSkippedMessage } = await context.loadState();

        if (hasSkippedMessage) {
            // A message came when we were processing results,
            // we have to check for changes again.
            await lib.checkMonitoredFiles(context, { filter: isNewFileOrFolder });
        }

        if (expiration) {
            const renewDate = moment(expiration).subtract(5, 'hours');
            if (moment().isSameOrAfter(renewDate)) {
                return lib.registerWebhook(context);
            }
        }
    }
};
