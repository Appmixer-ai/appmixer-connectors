#!/usr/bin/env node
// OpenClaw host status for the appmixer-sanity Operations page. Run by the openclaw-status systemd
// timer every 5 minutes; writes /var/lib/openclaw-status/status.json, which nginx serves behind a
// bearer token. Holds no secrets: versions, health, hook runs and the recent runs of the responder.
// Reference copy: .github/openclaw/vero-mention/build-status.js in Appmixer-ai/appmixer-connectors.
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const OUT = '/var/lib/openclaw-status/status.json';
const RESPONDER = '/root/.openclaw/workspace-vero/mention-responder';
const RECENT_RUNS = 8;
// A run with mentions but no replies yet is still working for this long; after that it failed.
const PENDING_MS = 30 * 60 * 1000;
const sh = (cmd, args) => {
    try {
        return execFileSync(cmd, args, { encoding: 'utf8', env: { ...process.env, XDG_RUNTIME_DIR: '/run/user/0' }, timeout: 30000 }).trim();
    } catch {
        return '';
    }
};
const readJson = (file) => {
    try {
        return JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch {
        return null;
    }
};

const config = JSON.parse(fs.readFileSync('/root/.openclaw/openclaw.json', 'utf8'));
// Latest published version (the update-check file moved in 2026.9; npm is the stable source).
const latest = sh('npm', ['view', 'openclaw', 'version']) || null;
const agents = (() => {
    try { return JSON.parse(sh('openclaw', ['agents', 'list', '--json'])).map((a) => a.id); } catch { return []; }
})();
const version = (sh('openclaw', ['--version']).match(/OpenClaw\s+(\S+)/) || [])[1] || null;

// Hook runs from the gateway journal, newest first.
const journal = sh('journalctl', ['--user', '-u', 'openclaw-gateway', '--no-pager', '--since', '-7 days', '-o', 'cat', '--grep', 'hook agent run completed']);
const journalRuns = journal.split('\n').filter(Boolean).map((line) => {
    const field = (name) => (line.match(new RegExp(`${name}=(\\S+)`)) || [])[1] || null;
    const summary = (line.match(/summary=(.*?)(?: model=|$)/) || [])[1] || null;
    return {
        at: (line.match(/^(\S+T\S+)/) || [])[1] || null,
        status: field('status'),
        model: field('model'),
        summary: summary ? summary.slice(0, 240) : null
    };
}).reverse().slice(0, 15);

// What each run did, from the agent's session transcript. A hook run is an isolated session that
// the gateway archives (zstd) when it ends; the transcript holds the prompt (with the PR number),
// every model call with its usage and cost, the exec steps by title, and the agent's closing text.
const SESSIONS = '/root/.openclaw/agents/vero/sessions';
const SESSION_AGE_MS = 8 * 24 * 3600 * 1000;
const SESSION_LIMIT = 30;
const sessionRuns = (() => {
    let files;
    try {
        files = fs.readdirSync(SESSIONS).filter((f) => f.endsWith('.zst'));
    } catch {
        return [];
    }
    return files
        .map((f) => ({ f, mtime: fs.statSync(path.join(SESSIONS, f)).mtimeMs }))
        .filter((x) => Date.now() - x.mtime < SESSION_AGE_MS)
        .sort((a, b) => b.mtime - a.mtime)
        .slice(0, SESSION_LIMIT)
        .map(({ f }) => {
            let entries;
            try {
                entries = sh('zstd', ['-dc', path.join(SESSIONS, f)]).split('\n').filter(Boolean).map((l) => JSON.parse(l));
            } catch {
                return null;
            }
            const text = (m) => typeof m?.content === 'string' ? m.content : (Array.isArray(m?.content) ? m.content : []).filter((c) => c.type === 'text').map((c) => c.text).join('\n');
            const user = entries.find((e) => e.type === 'message' && e.message?.role === 'user');
            const pr = (text(user?.message).match(/apx-vero mention on PR #(\d+)/) || [])[1];
            if (!pr) return null; // another kind of vero session
            const assistant = entries.filter((e) => e.type === 'message' && e.message?.role === 'assistant').map((e) => e.message);
            const steps = assistant.flatMap((m) => (m.content || []).filter((c) => c.type === 'toolCall').map((c) => c.arguments?.title || c.name));
            const last = assistant.length ? text(assistant[assistant.length - 1]).trim() : '';
            const sum = (pick) => assistant.reduce((n, m) => n + (Number(pick(m.usage || {})) || 0), 0);
            const startedAt = entries[0]?.timestamp || null;
            const endedAt = entries[entries.length - 1]?.timestamp || null;
            return {
                pr: Number(pr),
                startedAt,
                endedAt,
                durationSec: startedAt && endedAt ? Math.round((Date.parse(endedAt) - Date.parse(startedAt)) / 1000) : null,
                model: assistant[assistant.length - 1]?.model || null,
                modelCalls: assistant.length,
                toolCalls: steps.length,
                steps: steps.slice(0, 20),
                outputTokens: sum((u) => u.output),
                costUsd: Math.round(sum((u) => u.cost?.total) * 10000) / 10000,
                result: last.slice(0, 600),
                commentUrl: (last.match(/https:\/\/github\.com\/\S+#issuecomment-\d+/) || [])[0] || null
            };
        })
        .filter(Boolean);
})();

// A journal line is matched to the session that ended just before it (the gateway logs
// "completed" right after the transcript closes). Rejected runs (model policy) have no session.
const hookRuns = journalRuns.map((run) => {
    const at = Date.parse(run.at || '');
    const session = sessionRuns.find((s) => !s.used && s.endedAt && at - Date.parse(s.endedAt) >= 0 && at - Date.parse(s.endedAt) < 30000);
    if (session) session.used = true;
    const { used, ...details } = session || {};
    return { ...run, ...details, model: run.model || details.model || null };
});

const shadow = fs.existsSync(`${RESPONDER}/SHADOW`);
let shadowEntries = 0;
try {
    shadowEntries = fs.readFileSync(`${RESPONDER}/shadow-log.jsonl`, 'utf8').split('\n').filter(Boolean).length;
} catch { /* no log yet */ }

// Responder runs, newest first, from the run directories resolve.sh creates: <pr>-<yyyymmdd>-<hhmmss>.
// pr.json alone = resolve.sh found nothing to do (skipped); run.json = mentions were collected;
// replies.json = the agent answered them (post.sh posts right after it is written).
const runDirs = (() => {
    try {
        return fs.readdirSync(`${RESPONDER}/runs`).filter((d) => /^\d+-\d{8}-\d{6}$/.test(d));
    } catch {
        return [];
    }
})();
const runs = runDirs.map((dir) => {
    const [, pr, date, time] = dir.match(/^(\d+)-(\d{8})-(\d{6})$/);
    const at = `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6)}T${time.slice(0, 2)}:${time.slice(2, 4)}:${time.slice(4)}Z`;
    const base = path.join(RESPONDER, 'runs', dir);
    const run = readJson(path.join(base, 'run.json'));
    const mentions = readJson(path.join(base, 'mentions.json')) || [];
    const replies = readJson(path.join(base, 'replies.json'));
    const prInfo = readJson(path.join(base, 'pr.json'));
    const repliedAt = (() => {
        try { return fs.statSync(path.join(base, 'replies.json')).mtime.toISOString(); } catch { return null; }
    })();
    const status = !run ? 'skipped'
        : replies ? (shadow ? 'shadow' : 'replied')
            : Date.now() - Date.parse(at) < PENDING_MS ? 'pending' : 'failed';
    return {
        at,
        pr: Number(pr),
        title: run?.title || prInfo?.title || null,
        url: run?.url || prInfo?.html_url || `https://github.com/Appmixer-ai/appmixer-connectors/pull/${pr}`,
        status,
        // Why resolve.sh stopped: the PR is closed, not by apx-vero, or every mention is answered
        reason: !run && prInfo ? (prInfo.state !== 'open' ? `PR ${prInfo.state}` : prInfo.user?.login !== 'apx-vero' ? `PR by ${prInfo.user?.login}` : 'nothing pending') : null,
        mentions: mentions.map((m) => ({ kind: m.kind, id: String(m.id), author: m.author, url: m.url || null })),
        code_changed: Boolean(replies?.code_changed),
        repliedAt,
        durationMs: repliedAt ? Date.parse(repliedAt) - Date.parse(at) : null,
        replies: (replies?.replies || []).map((r) => ({
            kind: r.kind, id: String(r.id),
            body: String(r.body || '').replace(/<!--.*?-->/gs, '').trim().slice(0, 600)
        }))
    };
}).sort((a, b) => b.at.localeCompare(a.at)).slice(0, RECENT_RUNS);

const disk = sh('df', ['-h', '--output=used,size,pcent', '/']).split('\n')[1] || '';

const status = {
    generatedAt: new Date().toISOString(),
    host: os.hostname(),
    version,
    node: process.version,
    disk: disk.trim().replace(/\s+/g, ' '),
    gateway: { active: sh('systemctl', ['--user', 'is-active', 'openclaw-gateway']) === 'active' },
    update: latest ? { latest, available: Boolean(version && latest !== version) } : null,
    agents,
    hooks: (config.hooks?.enabled ? config.hooks.mappings || [] : []).map((m) => ({
        id: m.id, path: m.match?.path || null, agentId: m.agentId || null, model: m.model || null
    })),
    hookRuns,
    mentionResponder: {
        shadow,
        shadowEntries,
        runs: runDirs.length,
        recent: runs
    }
};

fs.mkdirSync('/var/lib/openclaw-status', { recursive: true });
fs.writeFileSync(`${OUT}.tmp`, JSON.stringify(status, null, 2), { mode: 0o644 });
fs.renameSync(`${OUT}.tmp`, OUT);
