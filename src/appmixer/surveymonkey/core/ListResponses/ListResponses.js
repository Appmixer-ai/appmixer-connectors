'use strict';

const lib = require('../../lib');

const ITEM_SCHEMA = {
    'type': 'object',
    'required': [
        'id',
        'survey_id',
        'response_status'
    ],
    'properties': {
        'id': {
            'type': 'string',
            'title': 'Response ID',
            'example': '114123456789'
        },
        'survey_id': {
            'type': 'string',
            'title': 'Survey ID',
            'example': '405123456'
        },
        'collector_id': {
            'type': 'string',
            'title': 'Collector ID',
            'example': '431234567'
        },
        'recipient_id': {
            'type': 'string',
            'title': 'Recipient ID',
            'example': '0'
        },
        'response_status': {
            'type': 'string',
            'title': 'Response Status',
            'example': 'completed'
        },
        'collection_mode': {
            'type': 'string',
            'title': 'Collection Mode',
            'example': 'default'
        },
        'total_time': {
            'type': 'integer',
            'title': 'Total Time (seconds)',
            'example': 144
        },
        'custom_value': {
            'type': 'string',
            'title': 'Custom Value',
            'example': 'order-1001'
        },
        'ip_address': {
            'type': 'string',
            'title': 'IP Address',
            'example': '192.0.2.16'
        },
        'date_created': {
            'type': 'string',
            'title': 'Date Created',
            'example': '2026-03-05T14:30:00+00:00'
        },
        'date_modified': {
            'type': 'string',
            'title': 'Date Modified',
            'example': '2026-03-05T14:32:24+00:00'
        },
        'edit_url': {
            'type': 'string',
            'title': 'Edit URL',
            'example': 'https://www.surveymonkey.com/r/?sm=abc123'
        },
        'analyze_url': {
            'type': 'string',
            'title': 'Analyze URL',
            'example': 'https://www.surveymonkey.com/analyze/browse/abc123'
        },
        'href': {
            'type': 'string',
            'title': 'API URL',
            'example': 'https://api.surveymonkey.com/v3/surveys/405123456/responses/114123456789'
        },
        'custom_variables': {
            'type': 'object',
            'title': 'Custom Variables',
            'example': {
                'custvar_1': 'one'
            },
            'properties': {}
        },
        'pages': {
            'type': 'array',
            'title': 'Pages',
            'example': [
                {
                    'id': '987654',
                    'questions': [
                        {
                            'id': '123456789',
                            'answers': [
                                {
                                    'text': 'Great service'
                                }
                            ]
                        }
                    ]
                }
            ],
            'items': {
                'type': 'object',
                'properties': {
                    'id': {
                        'type': 'string',
                        'title': 'Pages.Page ID',
                        'example': '987654'
                    },
                    'questions': {
                        'type': 'array',
                        'title': 'Pages.Questions',
                        'example': [
                            {
                                'id': '123456789',
                                'answers': [
                                    {
                                        'text': 'Great service'
                                    }
                                ]
                            }
                        ],
                        'items': {
                            'type': 'object',
                            'properties': {
                                'id': {
                                    'type': 'string',
                                    'title': 'Pages.Questions.Question ID',
                                    'example': '123456789'
                                },
                                'variable_id': {
                                    'type': 'string',
                                    'title': 'Pages.Questions.Variable ID',
                                    'example': '55512345'
                                },
                                'answers': {
                                    'type': 'array',
                                    'title': 'Pages.Questions.Answers',
                                    'example': [
                                        {
                                            'choice_id': '3057839051'
                                        }
                                    ],
                                    'items': {
                                        'type': 'object',
                                        'properties': {
                                            'choice_id': {
                                                'type': 'string',
                                                'title': 'Pages.Questions.Answers.Choice ID',
                                                'example': '3057839051'
                                            },
                                            'row_id': {
                                                'type': 'string',
                                                'title': 'Pages.Questions.Answers.Row ID',
                                                'example': '3057839052'
                                            },
                                            'col_id': {
                                                'type': 'string',
                                                'title': 'Pages.Questions.Answers.Column ID',
                                                'example': '3057839053'
                                            },
                                            'other_id': {
                                                'type': 'string',
                                                'title': 'Pages.Questions.Answers.Other ID',
                                                'example': '3057839054'
                                            },
                                            'text': {
                                                'type': 'string',
                                                'title': 'Pages.Questions.Answers.Text',
                                                'example': 'Great service'
                                            },
                                            'download_url': {
                                                'type': 'string',
                                                'title': 'Pages.Questions.Answers.Download URL',
                                                'example': 'https://www.surveymonkey.com/file/abc123'
                                            },
                                            'content_type': {
                                                'type': 'string',
                                                'title': 'Pages.Questions.Answers.Content Type',
                                                'example': 'image/png'
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
};

module.exports = {

    ITEM_SCHEMA,

    async receive(context) {

        const { surveyId, simple, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, ITEM_SCHEMA.properties, { label: 'Responses', value: 'result' });
        }

        if (!surveyId) {
            throw new context.CancelError('Survey is required!');
        }

        const params = {
            per_page: lib.MAX_BULK_PAGE_SIZE,
            sort_by: 'date_modified',
            sort_order: 'DESC'
        };
        if (simple) {
            params.simple = 'true';
        }
        const body = await lib.request(context, { path: '/surveys/' + lib.encodeId(surveyId) + '/responses/bulk', params });

        return lib.sendArrayOutput({ context, outputType, records: (body && body.data) || [] });
    }
};
