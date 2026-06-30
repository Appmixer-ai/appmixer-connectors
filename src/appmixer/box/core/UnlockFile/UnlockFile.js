'use strict';

module.exports = {

    async receive(context) {

        const { fileId } = context.messages.in.content;

        if (!fileId) {
            throw new context.CancelError('File ID is required!');
        }

        const headers = {
            'Authorization': `Bearer ${context.auth.accessToken}`,
            'Content-Type': 'application/json'
        };

        // https://developer.box.com/reference/put-files-id/
        // To unlock a file, send a PUT request with lock: null
        const { data } = await context.httpRequest({
            method: 'PUT',
            url: `https://api.box.com/2.0/files/${fileId}?fields=lock,id,type,name,file_version,created_at,modified_at,modified_by,owned_by,parent,path_collection,etag,description,size,trashed_at,purged_at,content_created_at,content_modified_at,is_externally_owned,has_collaborations,is_package,comment_count,permissions,tags,sha1,version_number,shared_link`,
            headers,
            data: { lock: null }
        });

        return context.sendJson(data, 'out');
    }
};
