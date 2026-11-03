AWS Knowledge Base Retrieval MCP Server
-------------------------------

An MCP server implementation for retrieving information from the AWS Knowledge Base using the Bedrock Agent Runtime. Ported from @modelcontextprotocol/server-aws-kb-retrieval 0.6.2 (deprecated on npm) into the bundled `server.js` on MCP SDK 1.32. Documentation: <a target=_blank href='https://mcp.so/server/aws-kb-retrieval-server/modelcontextprotocol?tab=content'>https://mcp.so/server/aws-kb-retrieval-server/modelcontextprotocol?tab=content</a>

NPM Repository
--------------

None - the server is `server.js` in this directory (originally @modelcontextprotocol/server-aws-kb-retrieval@0.6.2, now deprecated).

Generate Command
----------------

Do not re-run it with `--replace`: it would point lib.js back at the deprecated npm package. Kept for reference.

appmixer @modelcontextprotocol/server-aws-kb-retrieval /Users/jirihofman/prace/clientio/appmixer-connectors/src/appmixer/mcpservers/ --verbose --replace --label AWS Knowledge Base Retrieval --desc An MCP server implementation for retrieving information from the AWS Knowledge Base using the Bedrock Agent Runtime. --icon https://r2.trys.ai/imgs/2vyqphp5g-1742442281770.png --env AWS_ACCESS_KEY_ID,AWS_SECRET_ACCESS_KEY,AWS_REGION --docs https://mcp.so/server/aws-kb-retrieval-server/modelcontextprotocol?tab=content

Authentication
--------------

{
  'AWS_ACCESS_KEY_ID': {
    'type': 'text',
    'name': 'AWS_ACCESS_KEY_ID'
  },
  'AWS_SECRET_ACCESS_KEY': {
    'type': 'text',
    'name': 'AWS_SECRET_ACCESS_KEY'
  },
  'AWS_REGION': {
    'type': 'text',
    'name': 'AWS_REGION'
  }
}

