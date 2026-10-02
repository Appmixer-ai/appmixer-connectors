# apx-vero mention responder on OpenClaw (pilot)

The same job as `.github/workflows/vero-mention-responder.yml`, run by the `vero` agent of the
OpenClaw gateway on `hetzner-appmixer-agents` instead of a GitHub Actions runner. The agent keeps a
warm checkout with dependencies and, later, access to the QA instance, which a fresh runner lacks.

**Status: shadow pilot.** The Appmixer integration `CI - @apx-vero mention` calls both. The workflow
answers on GitHub; OpenClaw does the same work but posts and pushes nothing — it logs what it would
have posted to `shadow-log.jsonl`. Remove the `SHADOW` file and the `Repository Dispatch` step to
switch over.

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

In shadow mode `resolve.sh` counts a mention as answered only when it is in the shadow log; the
workflow's markers would otherwise make every shadow run find nothing to do.

## On the host

- Gateway: OpenClaw (`openclaw --version`), user systemd unit `openclaw-gateway`
  (`XDG_RUNTIME_DIR=/run/user/0 systemctl --user status openclaw-gateway`), config
  `/root/.openclaw/openclaw.json` (`hooks.*`, `gateway.trustedProxies`), secrets
  `/root/.openclaw/.env`.
- These files: `/root/.openclaw/workspace-vero/mention-responder/` (scripts, `INSTRUCTIONS.md`,
  `SHADOW`, `shadow-log.jsonl`, `repo/` base clone, `runs/<pr>-<timestamp>/`).
- Transform: `/root/.openclaw/hooks/transforms/vero-mention.mjs`.
- nginx site: `/etc/nginx/sites-enabled/openclaw-webhooks`.
- Hook token: `hooks.token` in the config (copy in `/root/backups/hook-token.txt`, root-only). The
  integration wizard field "OpenClaw hook headers" carries it; never commit it.

Copies here are the reference; deploy with `scp` to the paths above.

## Known limits

- The agent runs as root with the gateway's tools. The trusted scripts keep GitHub writes out of its
  hands, but the mention text is still model input; the instructions treat it as data only.
- The HTTP Post step logs its input, so the hook token is visible in the QA flow logs. Rotate it
  (`hooks.token`, then the instance's header) if those logs are shared.
- Run worktrees are not cleaned up yet (`git -C repo worktree prune` after removing old `runs/`).
