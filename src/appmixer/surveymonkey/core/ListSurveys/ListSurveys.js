'use strict';

const lib = require('../../lib');

const ITEM_SCHEMA = {
    'type': 'object',
    'required': [
        'id',
        'title',
        'href'
    ],
    'properties': {
        'id': {
            'type': 'string',
            'title': 'Survey ID',
            'example': '405123456'
        },
        'title': {
            'type': 'string',
            'title': 'Title',
            'example': 'Customer Satisfaction 2026'
        },
        'nickname': {
            'type': 'string',
            'title': 'Nickname',
            'example': 'CSAT Q1'
        },
        'href': {
            'type': 'string',
            'title': 'API URL',
            'example': 'https://api.surveymonkey.com/v3/surveys/405123456'
        },
        'language': {
            'type': 'string',
            'title': 'Language',
            'example': 'en'
        },
        'question_count': {
            'type': 'integer',
            'title': 'Question Count',
            'example': 10
        },
        'response_count': {
            'type': 'integer',
            'title': 'Response Count',
            'example': 12
        },
        'date_created': {
            'type': 'string',
            'title': 'Date Created',
            'example': '2026-03-05T14:30:00'
        },
        'date_modified': {
            'type': 'string',
            'title': 'Date Modified',
            'example': '2026-03-06T09:12:00'
        },
        'preview': {
            'type': 'string',
            'title': 'Preview URL',
            'example': 'https://www.surveymonkey.com/r/Preview/?sm=abc123'
        },
        'analyze_url': {
            'type': 'string',
            'title': 'Analyze URL',
            'example': 'https://www.surveymonkey.com/analyze/abc123'
        }
    }
};

module.exports = {

    ITEM_SCHEMA,

    async receive(context) {

        const { outputType } = context.messages.in.content;
        const { isSource } = context.properties;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, ITEM_SCHEMA.properties, { label: 'Surveys', value: 'result' });
        }

        let surveys;
        try {
            surveys = isSource
                ? await lib.callCached(context, { op: 'surveys' }, () => lib.listSurveys(context))
                : await lib.listSurveys(context);
        } catch (err) {
            if (isSource) {
                return context.sendJson({ result: [], count: 0 }, 'out');
            }
            throw err;
        }

        return lib.sendArrayOutput({ context, outputType: isSource ? 'array' : outputType, records: surveys });
    },

    toSelectArray({ result }) {

        return (result || []).map(survey => ({
            label: survey.title || survey.nickname || survey.id,
            value: survey.id
        }));
    }
};
