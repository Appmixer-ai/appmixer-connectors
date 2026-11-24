'use strict';

const lib = require('../../lib');

// The output contract of one board. Exported because the output port is dynamic.
const ITEM_SCHEMA = {
    type: 'object',
    properties: {
        id: {
            type: 'string',
            title: 'Board ID',
            example: 'uXjVLmJ9b1E='
        },
        name: {
            type: 'string',
            title: 'Name',
            example: 'Q4 Planning'
        },
        description: {
            type: 'string',
            title: 'Description',
            example: 'Roadmap brainstorm for Q4'
        },
        type: {
            type: 'string',
            title: 'Type',
            example: 'board'
        },
        viewLink: {
            type: 'string',
            title: 'View Link',
            example: 'https://miro.com/app/board/uXjVLmJ9b1E='
        },
        createdAt: {
            type: 'string',
            format: 'date-time',
            title: 'Created At',
            example: '2026-11-20T09:15:00Z'
        },
        modifiedAt: {
            type: 'string',
            format: 'date-time',
            title: 'Modified At',
            example: '2026-11-20T10:42:31Z'
        },
        team: {
            type: 'object',
            title: 'Team',
            properties: {
                id: {
                    type: 'string',
                    title: 'Team.ID',
                    example: '3458764512345678000'
                },
                name: {
                    type: 'string',
                    title: 'Team.Name',
                    example: 'Product Team'
                }
            },
            required: [
                'id'
            ]
        },
        project: {
            type: 'object',
            title: 'Project',
            properties: {
                id: {
                    type: 'string',
                    title: 'Project.ID',
                    example: '3458764598765432100'
                }
            },
            required: []
        },
        owner: {
            type: 'object',
            title: 'Owner',
            properties: {
                id: {
                    type: 'string',
                    title: 'Owner.ID',
                    example: '3458764512345678901'
                },
                name: {
                    type: 'string',
                    title: 'Owner.Name',
                    example: 'Jane Doe'
                },
                type: {
                    type: 'string',
                    title: 'Owner.Type',
                    example: 'user'
                }
            },
            required: [
                'id'
            ]
        },
        createdBy: {
            type: 'object',
            title: 'Created By',
            properties: {
                id: {
                    type: 'string',
                    title: 'Created By.ID',
                    example: '3458764512345678901'
                },
                name: {
                    type: 'string',
                    title: 'Created By.Name',
                    example: 'Jane Doe'
                },
                type: {
                    type: 'string',
                    title: 'Created By.Type',
                    example: 'user'
                }
            },
            required: [
                'id'
            ]
        },
        modifiedBy: {
            type: 'object',
            title: 'Modified By',
            properties: {
                id: {
                    type: 'string',
                    title: 'Modified By.ID',
                    example: '3458764512345678901'
                },
                name: {
                    type: 'string',
                    title: 'Modified By.Name',
                    example: 'Jane Doe'
                },
                type: {
                    type: 'string',
                    title: 'Modified By.Type',
                    example: 'user'
                }
            },
            required: [
                'id'
            ]
        },
        currentUserMembership: {
            type: 'object',
            title: 'Current User Membership',
            properties: {
                id: {
                    type: 'string',
                    title: 'Current User Membership.ID',
                    example: '3458764512345678901'
                },
                name: {
                    type: 'string',
                    title: 'Current User Membership.Name',
                    example: 'Jane Doe'
                },
                role: {
                    type: 'string',
                    title: 'Current User Membership.Role',
                    example: 'owner'
                }
            },
            required: [
                'id'
            ]
        },
        policy: {
            type: 'object',
            title: 'Policy',
            properties: {
                sharingPolicy: {
                    type: 'object',
                    title: 'Policy.Sharing Policy',
                    properties: {
                        access: {
                            type: 'string',
                            title: 'Policy.Sharing Policy.Access',
                            example: 'private'
                        },
                        teamAccess: {
                            type: 'string',
                            title: 'Policy.Sharing Policy.Team Access',
                            example: 'edit'
                        },
                        organizationAccess: {
                            type: 'string',
                            title: 'Policy.Sharing Policy.Organization Access',
                            example: 'private'
                        },
                        inviteToAccountAndBoardLinkAccess: {
                            type: 'string',
                            title: 'Policy.Sharing Policy.Invite Link Access',
                            example: 'no_access'
                        }
                    },
                    required: []
                },
                permissionsPolicy: {
                    type: 'object',
                    title: 'Policy.Permissions Policy',
                    properties: {
                        collaborationToolsStartAccess: {
                            type: 'string',
                            title: 'Policy.Permissions Policy.Collaboration Tools Start Access',
                            example: 'all_editors'
                        },
                        copyAccess: {
                            type: 'string',
                            title: 'Policy.Permissions Policy.Copy Access',
                            example: 'anyone'
                        },
                        sharingAccess: {
                            type: 'string',
                            title: 'Policy.Permissions Policy.Sharing Access',
                            example: 'team_members_with_editing_rights'
                        }
                    },
                    required: []
                }
            },
            required: []
        }
    },
    required: [
        'id',
        'name',
        'description',
        'type'
    ]
};

module.exports = {

    ITEM_SCHEMA,

    async receive(context) {

        const { query, owner, teamId, projectId, sort, outputType } = context.messages.in.content;
        const { isSource } = context.properties;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, ITEM_SCHEMA.properties, { label: 'Boards', value: 'result' });
        }

        const find = async () => {
            const filter = { query, owner, teamId, projectId, sort: sort && sort !== 'default' ? sort : undefined };
            // Without any filter: the boards of the account's team. Listing by team is instant,
            // a search sees new boards only after they are indexed.
            if (!query && !owner && !teamId && !projectId) {
                filter.teamId = await lib.defaultTeamId(context);
            }
            const { boards } = await lib.listBoardsPage(context, filter);
            return boards;
        };

        let boards;
        try {
            boards = isSource
                ? await lib.callCached(context, { op: 'boards' }, () => find())
                : await find();
        } catch (err) {
            if (isSource) {
                return context.sendJson({ result: [], count: 0 }, 'out');
            }
            throw err;
        }

        if (isSource) {
            return context.sendJson({ result: boards, count: boards.length }, 'out');
        }
        if (!boards.length) {
            return context.sendJson({}, 'notFound');
        }
        return lib.sendArrayOutput({ context, outputType, records: boards });
    },

    toSelectArray({ result }) {

        return (result || []).map(board => ({ label: board.name || board.id, value: board.id }));
    }
};
