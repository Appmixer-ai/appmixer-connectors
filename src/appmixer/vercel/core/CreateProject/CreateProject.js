
'use strict';

module.exports = {
    async receive(context) {

        const {
            name, accountId, framework, devCommand, buildCommand, outputDirectory, publicSource, teamId
        } = context.messages.in.content;

        if (!name) {
            throw new context.CancelError('Project name is required');
        }

        // Build request body
        const requestBody = { name };
        if (accountId) requestBody.accountId = accountId;
        if (framework) requestBody.framework = framework;
        if (devCommand) requestBody.devCommand = devCommand;
        if (buildCommand) requestBody.buildCommand = buildCommand;
        if (outputDirectory) requestBody.outputDirectory = outputDirectory;
        if (typeof publicSource === 'boolean') requestBody.publicSource = publicSource;

        // Build query parameters
        const params = new URLSearchParams();
        if (teamId) params.append('teamId', teamId);

        const url = `https://api.vercel.com/v9/projects${params.toString() ? '?' + params.toString() : ''}`;

        // https://vercel.com/docs/rest-api/reference/projects#create-project
        const { data } = await context.httpRequest({
            method: 'POST',
            url: url,
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`
            },
            data: requestBody
        });

        return context.sendJson(data, 'out');
    }
};
