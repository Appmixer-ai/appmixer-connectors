'use strict';

module.exports = {
    async receive(context) {

        const {
            id,
            name,
            description,
            avatar_url,
            is_spammer,
            links,
            handlesType,
            handlesHandle,
            groups,
            custom_fields
        } = context.messages.in.content;

        if (!id) {
            throw new context.CancelError('Contact ID is required.');
        }

        const updateData = {};

        if (name !== undefined) updateData.name = name;
        if (description !== undefined) updateData.description = description;
        if (avatar_url !== undefined) updateData.avatar_url = avatar_url;
        if (typeof is_spammer === 'boolean') updateData.is_spammer = is_spammer;
        if (links) {
            updateData.links = typeof links === 'string' ? links.split(',').map(s => s.trim()) : links;
        }
        if (handlesType && handlesHandle) {
            updateData.handles = [{
                type: handlesType,
                handle: handlesHandle
            }];
        }
        if (groups) {
            updateData.group_names = typeof groups === 'string' ? groups.split(',').map(s => s.trim()) : groups;
        }
        if (custom_fields && typeof custom_fields === 'object') updateData.custom_fields = custom_fields;

        // https://dev.frontapp.com/reference
        const { data } = await context.httpRequest({
            method: 'PATCH',
            url: `https://api2.frontapp.com/contacts/${id}`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'Content-Type': 'application/json'
            },
            data: updateData
        });

        return context.sendJson({}, 'out');
    }
};
