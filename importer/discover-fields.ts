import 'dotenv/config';
import { createMcpClient } from './src/mcp-client.js';

const client = await createMcpClient();

async function q(sql: string): Promise<Record<string, unknown>[]> {
  const result = await client.callTool({ name: 'query', arguments: { sql } });
  const content = result.content as Array<{ type: string; text: string }>;
  const parsed = JSON.parse(content[0].text);
  return Array.isArray(parsed) ? parsed : parsed.rows ?? [];
}

console.log('\n=== mcp_vorgaenge columns ===');
const vog = await q('SELECT * FROM mcp_vorgaenge LIMIT 1');
if (vog[0]) console.log(Object.keys(vog[0]).join('\n'));

console.log('\n=== mcp_buchung columns ===');
const bng = await q('SELECT * FROM mcp_buchung LIMIT 1');
if (bng[0]) console.log(Object.keys(bng[0]).join('\n'));

console.log('\n=== mcp_angebote columns ===');
const ang = await q('SELECT * FROM mcp_angebote LIMIT 1');
if (ang[0]) console.log(Object.keys(ang[0]).join('\n'));

await client.close();
