'use strict';

module.exports = {
    async receive(context) {
        const { fileId, lockExpiresAt } = context.messages.in.content;

        if (!fileId) {
            throw new context.CancelError('File ID is required!');
        }

        const lockData = {
            lock: {
                type: 'lock'
            }
        };

        if (lockExpiresAt) {
            lockData.lock.expires_at = lockExpiresAt;
        }

        // https://developer.box.com/reference/put-files-id/
        const { data } = await context.httpRequest({
            method: 'PUT',
            url: `https://api.box.com/2.0/files/${fileId}`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`
            },
            params: {
                fields: 'id,type,name,lock,file_version,created_at,modified_at,modified_by'
            },
            data: lockData
        });

        return context.sendJson(data, 'out');
    }
};
