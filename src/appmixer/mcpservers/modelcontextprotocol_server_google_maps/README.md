Google Maps MCP Server
-------------------------------

MCP Server for the Google Maps API. Ported from the deprecated @modelcontextprotocol/server-google-maps 0.6.2 to a bundled `server.js` running on @modelcontextprotocol/sdk 1.32.2 (same tools, input schemas and output). Documentation: <a target=_blank href='https://mcp.so/server/google-maps/modelcontextprotocol?tab=content'>https://mcp.so/server/google-maps/modelcontextprotocol?tab=content</a>

NPM Repository
--------------

None - the server is `server.js` in this directory (originally @modelcontextprotocol/server-google-maps@0.6.2, now deprecated).

Generate Command
----------------

Do not re-run it with `--replace`: it would point lib.js back at the deprecated npm package. Kept for reference.

appmixer @modelcontextprotocol/server-google-maps /tmp/mcpservers/src/appmixer/mcpservers/ --verbose --replace --label Google Maps --desc MCP Server for the Google Maps API. --icon https://cdn-icons-png.flaticon.com/128/15465/15465700.png --env GOOGLE_MAPS_API_KEY --docs https://mcp.so/server/google-maps/modelcontextprotocol?tab=content

Authentication
--------------

__VAR_AUTH__
