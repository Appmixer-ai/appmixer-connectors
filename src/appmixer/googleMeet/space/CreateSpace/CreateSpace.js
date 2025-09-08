'use strict';

module.exports = {
    async receive(context) {
        const {
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

        // Create space using Google Meet API
        const { data } = await context.httpRequest({
            method: 'POST',
            url: 'https://meet.googleapis.com/v2/spaces',
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`
            },
            data: body
        });

        context.log({ step: 'response_received', data });

        return context.sendJson(data, 'out');
    }
};
