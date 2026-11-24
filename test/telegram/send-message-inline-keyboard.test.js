'use strict';

const assert = require('assert');
const path = require('path');
const { createMockContext } = require('../utils');

const CONNECTOR = path.join(__dirname, '../../src/appmixer/telegram');
const lib = require(path.join(CONNECTOR, 'lib.js'));
const SendMessage = require(path.join(CONNECTOR, 'core/SendMessage/SendMessage.js'));

const contextFor = content => {
    const context = createMockContext();
    context.auth = { botToken: '123:abc' };
    context.messages = { in: { content } };
    context.httpRequest.resolves({ status: 200, data: { ok: true, result: { message_id: 7, date: 1, chat: { id: -1, type: 'group' } } } });
    return context;
};

describe('appmixer.telegram SendMessage inline keyboard', function() {

    describe('lib.buildInlineKeyboard', () => {

        const build = value => lib.buildInlineKeyboard(createMockContext(), value);

        it('returns undefined when there are no buttons', () => {
            assert.strictEqual(build(undefined), undefined);
            assert.strictEqual(build(''), undefined);
            assert.strictEqual(build({ ADD: [] }), undefined);
            // The designer leaves one empty row in an untouched expression field.
            assert.strictEqual(build({ ADD: [{ row: 1 }] }), undefined);
        });

        it('groups buttons by row number and orders the rows', () => {
            const keyboard = build({ ADD: [
                { text: 'Docs', url: 'https://appmixer.com', row: 2 },
                { text: 'Approve', callbackData: 'approve', row: 1 },
                { text: 'Reject', callbackData: 'reject', row: '1' }
            ] });
            assert.deepStrictEqual(keyboard, [
                [{ text: 'Approve', callback_data: 'approve' }, { text: 'Reject', callback_data: 'reject' }],
                [{ text: 'Docs', url: 'https://appmixer.com' }]
            ]);
        });

        it('puts buttons without a row number into row 1 and accepts a JSON string', () => {
            const keyboard = build(JSON.stringify({ ADD: [{ text: 'Go', callbackData: 'go' }] }));
            assert.deepStrictEqual(keyboard, [[{ text: 'Go', callback_data: 'go' }]]);
        });

        it('passes a ready-made inline_keyboard array through', () => {
            const ready = [[{ text: 'A', callback_data: 'a' }]];
            assert.deepStrictEqual(build(JSON.stringify(ready)), ready);
        });

        it('rejects invalid buttons', () => {
            assert.throws(() => build({ ADD: [{ callbackData: 'x' }] }), /Button Text is required/);
            assert.throws(() => build({ ADD: [{ text: 'A' }] }), /either Callback Data or URL/);
            assert.throws(() => build({ ADD: [{ text: 'A', callbackData: 'a', url: 'https://x.y' }] }), /either Callback Data or URL/);
            assert.throws(() => build({ ADD: [{ text: 'A', callbackData: 'x'.repeat(65) }] }), /at most 64 bytes/);
            assert.throws(() => build({ ADD: [{ text: 'A', callbackData: 'a', row: 0 }] }), /whole number/);
            assert.throws(() => build('not json'), /Inline Keyboard must be/);
        });
    });

    describe('SendMessage', () => {

        it('sends reply_markup.inline_keyboard when buttons are set', async () => {
            const context = contextFor({
                chatId: '-1',
                text: 'Hi',
                inlineKeyboard: { ADD: [{ text: 'Fire', callbackData: 'fire', row: 1 }] }
            });
            await SendMessage.receive(context);
            const request = context.httpRequest.firstCall.args[0];
            assert.strictEqual(request.url, 'https://api.telegram.org/bot123:abc/sendMessage');
            assert.deepStrictEqual(request.data.reply_markup, { inline_keyboard: [[{ text: 'Fire', callback_data: 'fire' }]] });
            assert.strictEqual(context.sendJson.firstCall.args[1], 'out');
        });

        it('sends no reply_markup without buttons', async () => {
            const context = contextFor({ chatId: '-1', text: 'Hi' });
            await SendMessage.receive(context);
            assert.strictEqual('reply_markup' in context.httpRequest.firstCall.args[0].data, false);
        });
    });
});
