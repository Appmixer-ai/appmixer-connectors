EverArt MCP Server
-------------------------------

AI image generation using various models. Ported from @modelcontextprotocol/server-everart 0.6.2 (deprecated on npm) into the bundled `server.js` on MCP SDK 1.32, which calls the EverArt REST API directly. Documentation: <a target=_blank href='https://mcp.so/server/everart/modelcontextprotocol?tab=content'>https://mcp.so/server/everart/modelcontextprotocol?tab=content</a>

NPM Repository
--------------

None - the server is `server.js` in this directory (originally @modelcontextprotocol/server-everart@0.6.2, now deprecated).

Generate Command
----------------

Do not re-run it with `--replace`: it would point lib.js back at the deprecated npm package. Kept for reference.

appmixer @modelcontextprotocol/server-everart /tmp/mcpservers/src/appmixer/mcpservers/ --verbose --replace --label EverArt --desc AI image generation using various models. --icon https://10web.io/wp-content/uploads/2024/07/EverArt.png --env EVERART_API_KEY --docs https://mcp.so/server/everart/modelcontextprotocol?tab=content

Authentication
--------------

__VAR_AUTH__
