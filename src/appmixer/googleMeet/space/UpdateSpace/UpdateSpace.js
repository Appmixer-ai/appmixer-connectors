'use strict';

module.exports = {
    async receive(context) {
        const {
            name,
            accessType,
            entryPointAccess,
            moderation,
            chatRestriction,
            reactionRestriction,
            presentRestriction,
            defaultJoinAsViewerType,
            attendanceReportGenerationType,
            autoRecordingGeneration,
            autoTranscriptionGeneration,
            autoSmartNotesGeneration
        } = context.messages.in.content;

        if (!name) {
            throw new context.CancelError('Space name is required!');
        }

        // Extract space ID from resource name
        const spaceId = name.startsWith('spaces/') ? name.split('/')[1] : name;

        // Build SpaceConfig according to API spec: https://developers.google.com/workspace/meet/api/reference/rest/v2/spaces#spaceconfig
        const body = {};

        // Only add config if any configuration options are specified
        if (accessType || entryPointAccess || moderation || attendanceReportGenerationType ||
            autoRecordingGeneration || autoTranscriptionGeneration || autoSmartNotesGeneration) {

            body.config = {
                accessType,
                entryPointAccess,
                moderation,
                attendanceReportGenerationType
            };

            if (moderation === 'ON') {
                body.config.moderationRestrictions = {
                    chatRestriction,
                    reactionRestriction,
                    presentRestriction,
                    defaultJoinAsViewerType
                };
            }

            if (autoRecordingGeneration || autoTranscriptionGeneration || autoSmartNotesGeneration) {
                body.config.artifactConfig = {
                    recordingConfig: { autoRecordingGeneration },
                    transcriptionConfig: { autoTranscriptionGeneration },
                    smartNotesConfig: { autoSmartNotesGeneration }
                };
            }
        }

        // Update space using Google Meet API
        await context.httpRequest({
            method: 'PATCH',
            url: `https://meet.googleapis.com/v2/spaces/${spaceId}`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`
            },
            data: body
        });

        return context.sendJson({}, 'out');
    }
};
