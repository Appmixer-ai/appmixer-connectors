'use strict';

const assert = require('assert');

const ListTickets = require('../../../tickets/ListTickets/ListTickets.js');
const GenerateTicketsOutput = require('../../../tickets/GenerateTicketsOutput/GenerateTicketsOutput.js');
const testUtils = require('../../../../../../test/utils.js');

describe('Freshdesk - ListTickets', function() {

    describe('getQuery', function() {

        it('builds correct query for agent and status', function() {
            const filters = {
                OR:[{ AND:[{ field:'agent', agentId:42 }, { field:'status', status:2 }] }]
            };

            const result = ListTickets.getQuery(filters);
            assert.equal(result, '"((agent_id:42 AND status:2))"');
        });

        it('builds correct query with tag and priority operator', function() {
            const filters = {
                OR:[{ AND:[{ field:'tag', tag:'urgent' }] },{ AND:[{ field:'priority', priorityOperator:'>', priorityValue:2 }] }]
            };

            const result = ListTickets.getQuery(filters);
            assert.equal(result, '"((tag:\'urgent\') OR (priority:>2))"');
        });
    });

    describe('ticketsToSelectArray', function() {

        it('converts tickets to select options', function() {
            const tickets = [{ id:11, subject:'Foo' },{ id:22, subject:'Bar' }];

            const result = ListTickets.ticketsToSelectArray({ tickets });
            assert.deepStrictEqual(result, [{ label:'Foo', value:11 },{ label:'Bar', value:22 }]);
        });
    });

    describe('GenerateTicketsOutput', function() {

        it('getOutputOptions returns tickets when allAtOnce true', function() {
            const result = GenerateTicketsOutput.getOutputOptions({ allAtOnce: true });
            assert.deepStrictEqual(result, [{ label: 'Tickets', value: 'tickets' }]);
        });

        it('getOutputOptions returns fields when allAtOnce false', function() {
            const result = GenerateTicketsOutput.getOutputOptions({ allAtOnce: false });
            assert.ok(Array.isArray(result), 'should return array');
            assert.ok(result.some(opt => opt.value === 'id'));
            assert.ok(result.some(opt => opt.value === 'ticketJson'));
        });

        it('getTicketComponentOutput includes embed fields', function() {
            const embedFields = ['conversations','requester','company','stats'];
            const result = GenerateTicketsOutput.getTicketComponentOutput({ embedFields });
            assert.ok(result.some(f => f.value === 'ticketJson'));
            assert.ok(result.some(f => f.value === 'conversations'));
            assert.ok(result.some(f => f.value === 'requesterName'));
            assert.ok(result.some(f => f.value === 'company'));
            assert.ok(result.some(f => f.value === 'stats'));
        });

        it('triggerOutputOptions adjusts fields for requester and description', function() {
            const result1 = GenerateTicketsOutput.triggerOutputOptions({ embedFields: ['requester'] });
            assert.ok(result1.some(f => f.value === 'requesterId'));
            assert.ok(result1.some(f => f.value === 'requesterEmail'));

            const result2 = GenerateTicketsOutput.triggerOutputOptions({ embedFields: ['description'] });
            assert.ok(result2.some(f => f.value === 'description'));
        });

        it('receive sends appropriate out payload based on operation', async function() {
            const context = testUtils.createMockContext();

            context.properties = { operation: 1, allAtOnce: true, embedFields: ['conversations'] };
            await GenerateTicketsOutput.receive(context);
            assert.equal(context.sendJson.callCount, 1);
            assert.deepStrictEqual(context.sendJson.getCall(0).args[0], { allAtOnce: true });
            assert.equal(context.sendJson.getCall(0).args[1], 'out');

            context.sendJson.resetHistory();
            context.properties = { operation: 2, embedFields: ['conversations'] };
            await GenerateTicketsOutput.receive(context);
            assert.equal(context.sendJson.callCount, 1);
            assert.deepStrictEqual(context.sendJson.getCall(0).args[0], { embedFields: ['conversations'] });
            assert.equal(context.sendJson.getCall(0).args[1], 'out');
        });
    });
});
