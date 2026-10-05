const assert = require('assert');

const NewIssue = require('../../list/NewIssue/NewIssue');

/**
 * In-memory stand-in for GET /search/issues: filters on state, honors sort/order/page/per_page
 * and reports total_count.
 */
function createRepo() {

    const issues = [];
    let nextId = 1;
    let clock = Date.UTC(2026, 0, 1);

    return {
        requests: [],
        add(count = 1, fields = {}) {
            const added = [];
            for (let i = 0; i < count; i++) {
                clock += 60000;
                const issue = { id: nextId++, state: 'open', created_at: new Date(clock).toISOString(), ...fields };
                issues.push(issue);
                added.push(issue);
            }
            return added;
        },
        search(options) {
            this.requests.push(options);
            const { sort, order, page = 1, per_page: perPage = 30 } = options.params;
            const state = (options.url.match(/state:(\w+)/) || [])[1];
            const matching = issues.filter(issue => !state || issue.state === state);
            if (sort === 'created') {
                matching.sort((a, b) => a.created_at < b.created_at ? -1 : 1);
                if (order !== 'asc') {
                    matching.reverse();
                }
            }
            return {
                data: {
                    total_count: matching.length,
                    incomplete_results: false,
                    items: matching.slice((page - 1) * perPage, page * perPage)
                }
            };
        }
    };
}

function createContext(repo, state = {}) {

    const context = {
        properties: { repositoryId: 'octocat/Hello-World', state: 'open' },
        state,
        accessToken: 'token',
        sent: [],
        CancelError: Error,
        httpRequest: async options => repo.search(options),
        sendJson: async (data, port) => {
            context.sent.push({ id: data.id, port });
        },
        saveState: async newState => {
            context.state = newState;
        }
    };
    return context;
}

const sentIds = context => context.sent.map(message => message.id);

describe('github NewIssue', () => {

    it('emits nothing on the first tick and asks for the newest issues first', async () => {

        const repo = createRepo();
        repo.add(3);
        const context = createContext(repo);

        await NewIssue.tick(context);

        assert.deepStrictEqual(context.sent, []);
        assert.strictEqual(repo.requests.length, 1);
        assert.strictEqual(repo.requests[0].params.sort, 'created');
        assert.strictEqual(repo.requests[0].params.order, 'desc');
        assert.deepStrictEqual(context.state.known, [3, 2, 1]);
    });

    it('emits an issue created after the previous tick, once', async () => {

        const repo = createRepo();
        repo.add(3);
        const context = createContext(repo);
        await NewIssue.tick(context);

        const [created] = repo.add();
        await NewIssue.tick(context);
        await NewIssue.tick(context);

        assert.deepStrictEqual(context.sent, [{ id: created.id, port: 'issue' }]);
    });

    it('emits the first issue of a repository that had none', async () => {

        const repo = createRepo();
        const context = createContext(repo);
        await NewIssue.tick(context);

        const [created] = repo.add();
        await NewIssue.tick(context);

        assert.deepStrictEqual(sentIds(context), [created.id]);
    });

    it('does not emit an old issue that moves onto the page when a newer one is closed', async () => {

        const repo = createRepo();
        const existing = repo.add(250);
        const context = createContext(repo);
        await NewIssue.tick(context);

        // Three of the 100 newest issues leave the results, three older ones take their place.
        existing[249].state = 'closed';
        existing[200].state = 'closed';
        existing[151].state = 'closed';
        await NewIssue.tick(context);
        assert.deepStrictEqual(context.sent, []);

        // The window has moved down; a really new issue is still found.
        const [created] = repo.add();
        await NewIssue.tick(context);
        assert.deepStrictEqual(sentIds(context), [created.id]);

        // And the older issues that are on the page now do not fire on the next ticks either.
        existing[248].state = 'closed';
        await NewIssue.tick(context);
        assert.deepStrictEqual(sentIds(context), [created.id]);
    });

    it('emits an older issue that starts to match when all matching issues fit on a page', async () => {

        const repo = createRepo();
        const [closed] = repo.add(1, { state: 'closed' });
        repo.add(5);
        const context = createContext(repo);
        await NewIssue.tick(context);

        closed.state = 'open';
        await NewIssue.tick(context);

        assert.deepStrictEqual(sentIds(context), [closed.id]);
    });

    it('emits an issue inside the watched window that starts to match', async () => {

        const repo = createRepo();
        const existing = repo.add(250);
        existing[220].state = 'closed';
        const context = createContext(repo);
        await NewIssue.tick(context);

        existing[220].state = 'open';
        await NewIssue.tick(context);

        assert.deepStrictEqual(sentIds(context), [existing[220].id]);
    });

    it('reads further pages when more than a page of issues was created, oldest first', async () => {

        const repo = createRepo();
        repo.add(120);
        const context = createContext(repo);
        await NewIssue.tick(context);
        repo.requests.length = 0;

        const created = repo.add(230);
        await NewIssue.tick(context);

        assert.deepStrictEqual(sentIds(context), created.map(issue => issue.id));
        assert.deepStrictEqual(repo.requests.map(request => request.params.page), [1, 2, 3]);

        // Nothing fires again and one request is enough on a quiet tick.
        repo.requests.length = 0;
        await NewIssue.tick(context);
        assert.strictEqual(context.sent.length, created.length);
        assert.strictEqual(repo.requests.length, 1);
    });

    it('does not re-emit old issues on the first tick after an upgrade from a state without a floor', async () => {

        const repo = createRepo();
        const existing = repo.add(250);
        // What the previous version stored: the IDs of one page in best match order and no floor.
        // Even if that page were not the 100 newest issues, only the ones created since may fire.
        const legacyPage = existing.filter((issue, index) => index % 3 === 0);
        assert.ok(legacyPage.includes(existing[249]));
        const context = createContext(repo, { known: legacyPage.map(issue => issue.id) });

        const created = repo.add(2);
        await NewIssue.tick(context);

        assert.deepStrictEqual(sentIds(context), created.map(issue => issue.id));
        assert.strictEqual(typeof context.state.floor, 'string');
    });

    it('keeps emitting every unseen issue after an upgrade when all of them fit on a page', async () => {

        const repo = createRepo();
        const existing = repo.add(5);
        const context = createContext(repo, { known: existing.map(issue => issue.id) });

        const [created] = repo.add();
        await NewIssue.tick(context);

        assert.deepStrictEqual(sentIds(context), [created.id]);
        assert.strictEqual(context.state.floor, null);
    });

    it('test() returns the most recently created issue', async () => {

        const repo = createRepo();
        const existing = repo.add(4);
        const context = createContext(repo);

        await NewIssue.test(context);

        assert.deepStrictEqual(context.sent, [{ id: existing[3].id, port: 'issue' }]);
    });
});
