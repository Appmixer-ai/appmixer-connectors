
'use strict';

module.exports = {
    async receive(context) {

        const {
            id, name, devCommand, buildCommand, outputDirectory, publicSource, teamId
        } = context.messages.in.content;

        if (!id) {
            throw new context.CancelError('Project ID is required');
        }

        // Build request body with only defined values
        const requestBody = {};
        if (name) requestBody.name = name;
        if (devCommand) requestBody.devCommand = devCommand;
        if (buildCommand) requestBody.buildCommand = buildCommand;
        if (outputDirectory) requestBody.outputDirectory = outputDirectory;
        if (typeof publicSource === 'boolean') requestBody.publicSource = publicSource;

        // Build query parameters
        const params = new URLSearchParams();
        if (teamId) params.append('teamId', teamId);

        const url = `https://api.vercel.com/v9/projects/${encodeURIComponent(id)}${params.toString() ? '?' + params.toString() : ''}`;

        // https://vercel.com/docs/rest-api/reference/projects#update-project
        await context.httpRequest({
            method: 'PATCH',
            url: url,
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`
            },
            data: requestBody
        });

        return context.sendJson({}, 'out');
    }
};
