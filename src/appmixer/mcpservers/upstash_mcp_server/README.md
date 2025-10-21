undefined MCP Server
-------------------------------

Upstash is a serverless database platform that offers different products, including Redis, QStash and Vector database (@upstash/mcp-server 0.2.0). Documentation: <a target=_blank href='https://upstash.com/docs/redis/integrations/mcp'>https://upstash.com/docs/redis/integrations/mcp</a>

NPM Repository
--------------

@upstash/mcp-server@0.2.0

Generate Command
----------------

appmixer @upstash/mcp-server /Users/jirihofman/prace/clientio/appmixer-connectors/src/appmixer/mcpservers/ --verbose --replace --label undefined --desc Upstash is a serverless database platform that offers different products, including Redis, QStash and Vector database --icon https://upstash.com/logo/upstash-icon-white-bg.png --env UPSTASH_EMAIL,UPSTASH_API_KEY --scriptArgs run --docs https://upstash.com/docs/redis/integrations/mcp

Authentication
--------------

{
  'UPSTASH_EMAIL': {
    'type': 'text',
    'name': 'UPSTASH_EMAIL'
  },
  'UPSTASH_API_KEY': {
    'type': 'text',
    'name': 'UPSTASH_API_KEY'
  }
}

