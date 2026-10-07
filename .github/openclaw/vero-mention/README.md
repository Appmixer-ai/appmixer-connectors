# apx-vero mention responder on OpenClaw

Answers people who @-mention apx-vero on its pull requests. Runs as the `vero` agent of the OpenClaw
gateway on `hetzner-appmixer-agents`; it replaced the GitHub Actions workflow
`vero-mention-responder.yml` (removed 2026-10-07). The agent keeps a warm checkout with dependencies
and, later, access to the QA instance, which a fresh runner lacked.

**Status: live since 2026-10-07.** The Appmixer integration `CI - @apx-vero mention -> OpenClaw vero
agent` calls only this hook. The shadow pilot (2026-10-02 to 2026-10-07) compared one run on PR #1363
with the reply of the former Actions workflow; they matched.

## Flow of a mention

1. `GitHub / New Mention` → `Condition` (pull request) → `HTTP Post`
   `https://91-99-144-37.nip.io/hooks/vero-mention` with `{"pr_url": "<subject.url>"}` and the hook
   token as `Authorization: Bearer …`.
2. nginx exposes only that path (rate-limited) and forwards it to the gateway on loopback.
3. The gateway hook mapping `vero-mention` runs `vero-mention.mjs`: it accepts only a pull request API
   URL of `Appmixer-ai/appmixer-connectors` (else HTTP 204, no run) and hands `vero` a fixed
   instruction with the PR number — no text from the payload reaches the agent.
4. The agent follows `INSTRUCTIONS.md`: `resolve.sh` (trusted: PR by apx-vero, head in the apx-vero
   fork, open; collects unanswered mentions by people; makes a git worktree of the head branch) →
   edits and checks → `push.sh` (trusted) → writes `replies.json` → `post.sh` (trusted: posts only
   replies to collected mentions, each with the `<!-- apx-vero-mention:<kind>:<id> -->` marker).

Shadow mode is still built in: while the file `SHADOW` exists, `push.sh` and `post.sh` write to
`shadow-log.jsonl` instead of GitHub and `resolve.sh` counts only that log as answered, so another
responder can answer first. Create the file to compare, remove it to go live.

## On the host

- Gateway: OpenClaw (`openclaw --version`), user systemd unit `openclaw-gateway`
  (`XDG_RUNTIME_DIR=/run/user/0 systemctl --user status openclaw-gateway`), config
  `/root/.openclaw/openclaw.json` (`hooks.*`, `gateway.trustedProxies`), secrets
  `/root/.openclaw/.env`.
- These files: `/root/.openclaw/workspace-vero/mention-responder/` (scripts, `INSTRUCTIONS.md`,
  `SHADOW`, `shadow-log.jsonl`, `repo/` base clone, `runs/<pr>-<timestamp>/`).
- Transform: `/root/.openclaw/hooks/transforms/vero-mention.mjs`.
- nginx site: `/etc/nginx/sites-enabled/openclaw-webhooks`. It also serves `/status/openclaw.json`
  (bearer token) for the appmixer-sanity Operations page: `build-status.js` here is the reference copy
  of `/root/openclaw-status/build-status.js`, run by the `openclaw-status` systemd timer every 5 min.
  It lists the recent runs of this responder from `runs/` (replied / skipped / pending / failed) and
  pairs each hook run of the gateway journal with the agent's archived session transcript
  (`/root/.openclaw/agents/vero/sessions/*.zst`): PR, duration, model calls, exec steps, cost and the
  closing text. The gateway archives a run's transcript when the next run starts, so the newest run
  has no details until then.
- Hook token: `hooks.token` in the config (copy in `/root/backups/hook-token.txt`, root-only). The
  integration wizard field "OpenClaw hook headers" carries it; never commit it.

Copies here are the reference; deploy with `scp` to the paths above.

## Known limits

- The agent runs as root with the gateway's tools. The trusted scripts keep GitHub writes out of its
  hands, but the mention text is still model input; the instructions treat it as data only.
- The HTTP Post step logs its input, so the hook token is visible in the QA flow logs. Rotate it
  (`hooks.token`, then the instance's header) if those logs are shared.
- Run worktrees are not cleaned up yet (`git -C repo worktree prune` after removing old `runs/`).
