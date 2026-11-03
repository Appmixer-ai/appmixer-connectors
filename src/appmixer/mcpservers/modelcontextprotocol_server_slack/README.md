Slack MCP Server
-------------------------------

MCP Server for Slack. Ported from @modelcontextprotocol/server-slack 2025.4.25 (deprecated on npm) into the bundled `server.js` on MCP SDK 1.32. Documentation: <a target=_blank href='https://mcp.so/server/slack/modelcontextprotocol?tab=content'>https://mcp.so/server/slack/modelcontextprotocol?tab=content</a>

NPM Repository
--------------

None - the server is `server.js` in this directory (originally @modelcontextprotocol/server-slack@2025.4.25, now deprecated).

Generate Command
----------------

Do not re-run it with `--replace`: it would point lib.js back at the deprecated npm package. Kept for reference.

appmixer @modelcontextprotocol/server-slack /tmp/mcpservers/src/appmixer/mcpservers/ --verbose --replace --label Slack --desc MCP Server for Slack. --icon https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/Slack_icon_2019.svg/2048px-Slack_icon_2019.svg.png --env SLACK_BOT_TOKEN,SLACK_TEAM_ID --docs https://mcp.so/server/slack/modelcontextprotocol?tab=content

Authentication
--------------

__VAR_AUTH__
