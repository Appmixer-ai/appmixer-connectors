GitLab MCP Server
-------------------------------

GitLab API, enabling project management. (Bundled `server.js`, a port of @modelcontextprotocol/server-gitlab 2025.4.25 to MCP SDK 1.32.2 with the same tools.) Documentation: <a target=_blank href='https://mcp.so/server/gitlab/modelcontextprotocol?tab=content'>https://mcp.so/server/gitlab/modelcontextprotocol?tab=content</a>

NPM Repository
--------------

None - the server is `server.js` in this directory (originally @modelcontextprotocol/server-gitlab@2025.4.25, now deprecated).

Generate Command
----------------

Do not re-run it with `--replace`: it would point lib.js back at the deprecated npm package. Kept for reference.

appmixer @modelcontextprotocol/server-gitlab /tmp/mcpservers/src/appmixer/mcpservers/ --verbose --replace --label GitLab --desc GitLab API, enabling project management. --icon https://r2.trys.ai/imgs/1yqvdha3j-1733449620948.png --env GITLAB_PERSONAL_ACCESS_TOKEN,GITLAB_API_URL --docs https://mcp.so/server/gitlab/modelcontextprotocol?tab=content

Authentication
--------------

__VAR_AUTH__
