import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';

export async function createMcpClient(): Promise<Client> {
  const url = process.env.BOS_MCP_URL;
  if (!url) throw new Error('BOS_MCP_URL is not set in .env');

  const transport = new SSEClientTransport(new URL(url));

  const client = new Client(
    { name: 'bos-kpi-importer', version: '1.0.0' },
    { capabilities: { tools: {} } }
  );

  await client.connect(transport);
  return client;
}

export async function listAvailableTools(client: Client) {
  const result = await client.listTools();
  return result.tools;
}
