'use strict';

const lib = require('../../lib');

module.exports = {
    async receive(context) {
        const { conversationId, outputType } = context.messages.in.content;

        if (!conversationId) {
            throw new context.CancelError('Conversation ID is required.');
        }

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Drafts' });
        }

        // https://dev.frontapp.com/reference/list-conversation-drafts
        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://api2.frontapp.com/conversations/${conversationId}/drafts`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`
            }
        });

        return lib.sendArrayOutput({ context, records: data['_results'], outputType });
    }
};

const schema = {
    '_links': {
        'type': 'object',
        'properties': {
            'self': { 'type': 'string', 'title': 'Links.Self' },
            'related': {
                'type': 'object',
                'properties': {
                    'conversation': { 'type': 'string', 'title': 'Links.Related.Conversation' },
                    'message_replied_to': { 'type': 'string', 'title': 'Links.Related.Message Replied To' },
                    'message_seen': { 'type': 'string', 'title': 'Links.Related.Message Seen' }
                },
                'title': 'Links.Related'
            }
        },
        'title': 'Links'
    },
    'id': { 'type': 'string', 'title': 'Draft Message ID' },
    'message_uid': { 'type': 'string', 'title': 'Message UID' },
    'type': { 'type': 'string', 'title': 'Type' },
    'is_inbound': { 'type': 'boolean', 'title': 'Is Inbound' },
    'draft_mode': { 'type': 'string', 'title': 'Draft Mode' },
    'error_type': { 'type': 'string', 'title': 'Error Type' },
    'version': { 'type': 'string', 'title': 'Version' },
    'created_at': { 'type': 'number', 'title': 'Created At' },
    'subject': { 'type': 'string', 'title': 'Subject' },
    'blurb': { 'type': 'string', 'title': 'Blurb' },
    'body': { 'type': 'string', 'title': 'Body' },
    'text': { 'type': 'string', 'title': 'Text' },
    'author': {
        'type': 'object',
        'properties': {
            '_links': {
                'type': 'object',
                'properties': {
                    'self': { 'type': 'string', 'title': 'Author.Links.Self' },
                    'related': {
                        'type': 'object',
                        'properties': {
                            'inboxes': { 'type': 'string', 'title': 'Author.Links.Related.Inboxes' },
                            'conversations': { 'type': 'string', 'title': 'Author.Links.Related.Conversations' },
                            'botSource': { 'type': 'string', 'title': 'Author.Links.Related.Bot Source' }
                        },
                        'title': 'Author.Links.Related'
                    }
                },
                'title': 'Author.Links'
            },
            'id': { 'type': 'string', 'title': 'Author.ID' },
            'email': { 'type': 'string', 'title': 'Author.Email' },
            'username': { 'type': 'string', 'title': 'Author.Username' },
            'first_name': { 'type': 'string', 'title': 'Author.First Name' },
            'last_name': { 'type': 'string', 'title': 'Author.Last Name' },
            'is_admin': { 'type': 'boolean', 'title': 'Author.Is Admin' },
            'is_available': { 'type': 'boolean', 'title': 'Author.Is Available' },
            'is_blocked': { 'type': 'boolean', 'title': 'Author.Is Blocked' },
            'type': { 'type': 'string', 'title': 'Author.Type' },
            'custom_fields': {
                'type': 'object',
                'title': 'Author.Custom Fields'
            }
        },
        'title': 'Author'
    },
    'recipients': {
        'type': 'array',
        'items': {
            'type': 'object',
            'properties': {
                '_links': {
                    'type': 'object',
                    'properties': {
                        'related': {
                            'type': 'object',
                            'properties': {
                                'contact': { 'type': 'string', 'title': 'Recipients.Links.Related.Contact' }
                            },
                            'title': 'Recipients.Links.Related'
                        }
                    },
                    'title': 'Recipients.Links'
                },
                'name': { 'type': 'string', 'title': 'Recipients.Name' },
                'handle': { 'type': 'string', 'title': 'Recipients.Handle' },
                'role': { 'type': 'string', 'title': 'Recipients.Role' }
            }
        },
        'title': 'Recipients'
    },
    'attachments': {
        'type': 'array',
        'items': {
            'type': 'object',
            'properties': {
                'id': { 'type': 'string', 'title': 'Attachments.ID' },
                'filename': { 'type': 'string', 'title': 'Attachments.Filename' },
                'url': { 'type': 'string', 'title': 'Attachments.URL' },
                'content_type': { 'type': 'string', 'title': 'Attachments.Content Type' },
                'size': { 'type': 'number', 'title': 'Attachments.Size' },
                'metadata': {
                    'type': 'object',
                    'properties': {
                        'is_inline': { 'type': 'boolean', 'title': 'Attachments.Metadata.Is Inline' },
                        'cid': { 'type': 'string', 'title': 'Attachments.Metadata.CID' }
                    },
                    'title': 'Attachments.Metadata'
                }
            }
        },
        'title': 'Attachments'
    },
    'signature': {
        'type': 'object',
        'properties': {
            '_links': {
                'type': 'object',
                'properties': {
                    'self': { 'type': 'string', 'title': 'Signature.Links.Self' },
                    'related': {
                        'type': 'object',
                        'properties': {
                            'owner': { 'type': 'string', 'title': 'Signature.Links.Related.Owner' }
                        },
                        'title': 'Signature.Links.Related'
                    }
                },
                'title': 'Signature.Links'
            },
            'id': { 'type': 'string', 'title': 'Signature.ID' },
            'name': { 'type': 'string', 'title': 'Signature.Name' },
            'body': { 'type': 'string', 'title': 'Signature.Body' },
            'sender_info': {
                'type': 'object',
                'title': 'Signature.Sender Info'
            },
            'is_visible_for_all_teammate_channels': { 'type': 'boolean', 'title': 'Signature.Is Visible For All Teammate Channels' },
            'is_default': { 'type': 'boolean', 'title': 'Signature.Is Default' },
            'is_private': { 'type': 'boolean', 'title': 'Signature.Is Private' },
            'channel_ids': {
                'type': 'array',
                'items': { 'type': 'string' },
                'title': 'Signature.Channel IDs'
            }
        },
        'title': 'Signature'
    },
    'metadata': {
        'type': 'object',
        'properties': {
            'intercom_url': { 'type': 'string', 'title': 'Metadata.Intercom URL' },
            'duration': { 'type': 'number', 'title': 'Metadata.Duration' },
            'have_been_answered': { 'type': 'boolean', 'title': 'Metadata.Have Been Answered' },
            'external_id': { 'type': 'string', 'title': 'Metadata.External ID' },
            'twitter_url': { 'type': 'string', 'title': 'Metadata.Twitter URL' },
            'is_retweet': { 'type': 'boolean', 'title': 'Metadata.Is Retweet' },
            'have_been_retweeted': { 'type': 'boolean', 'title': 'Metadata.Have Been Retweeted' },
            'have_been_favorited': { 'type': 'boolean', 'title': 'Metadata.Have Been Favorited' },
            'thread_ref': { 'type': 'string', 'title': 'Metadata.Thread Ref' },
            'headers': {
                'type': 'object',
                'title': 'Metadata.Headers'
            },
            'chat_visitor_url': { 'type': 'string', 'title': 'Metadata.Chat Visitor URL' }
        },
        'title': 'Metadata'
    }
};
