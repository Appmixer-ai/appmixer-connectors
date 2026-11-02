Firecrawl (MCP Server) MCP Server
-------------------------------

Turn websites into LLM-ready data. Ported from firecrawl-mcp 3.3.6 (pinned to MCP SDK 1.18.0) into the bundled `server.js` on MCP SDK 1.32; same six tools (firecrawl_scrape, firecrawl_map, firecrawl_search, firecrawl_crawl, firecrawl_check_crawl_status, firecrawl_extract) against the Firecrawl v2 REST API. Documentation: <a target=_blank href='https://github.com/mendableai/firecrawl-mcp-server'>https://github.com/mendableai/firecrawl-mcp-server</a>

NPM Repository
--------------

None - the server is `server.js` in this directory (originally firecrawl-mcp@3.3.6).

Generate Command
----------------

Do not re-run it with `--replace`: it would point lib.js back at the npm package. Kept for reference.

appmixer firecrawl-mcp /Users/jirihofman/prace/clientio/appmixer-connectors/src/appmixer/mcpservers/ --verbose --replace --label Firecrawl --desc Turn websites into LLM-ready data. --icon https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQa4UmEzjkrxR0uzg0vv8BNXM9lV8nNSLtTQ7lcduDHb0FWRrD8AvuGkzLnJ6FKWDAfy8g&usqp=CAU --env FIRECRAWL_API_KEY --docs https://github.com/mendableai/firecrawl-mcp-server

Authentication
--------------

{
  'FIRECRAWL_API_KEY': {
    'type': 'text',
    'name': 'FIRECRAWL_API_KEY'
  }
}

