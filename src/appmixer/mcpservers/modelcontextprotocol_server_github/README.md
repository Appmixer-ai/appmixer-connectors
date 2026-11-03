Github MCP Server
-------------------------------

MCP Server for Github. Ported from @modelcontextprotocol/server-github 2025.4.8 (deprecated on npm, server version 0.6.2) into the bundled `server.js` on MCP SDK 1.32. Documentation: <a target=_blank href='https://mcp.so/server/github/modelcontextprotocol?tab=content'>https://mcp.so/server/github/modelcontextprotocol?tab=content</a>

NPM Repository
--------------

None - the server is `server.js` (plus `server-common.js`, `server-schemas.js` and `server-operations.js`; a subdirectory would be loaded as a component and fail the publish) in this directory (originally @modelcontextprotocol/server-github@2025.4.8, now deprecated).

Generate Command
----------------

Do not re-run it with `--replace`: it would point lib.js back at the deprecated npm package. Kept for reference.

appmixer @modelcontextprotocol/server-github /tmp/mcpservers/src/appmixer/mcpservers/ --verbose --replace --label Github --desc MCP Server for Github. --icon https://cdn.creazilla.com/icons/3251047/github-logo-icon-size_512.png --env GITHUB_PERSONAL_ACCESS_TOKEN --docs https://mcp.so/server/github/modelcontextprotocol?tab=content

Authentication
--------------

__VAR_AUTH__
