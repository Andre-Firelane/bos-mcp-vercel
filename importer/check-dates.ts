import 'dotenv/config';
import { createMcpClient } from './src/mcp-client.js';

const client = await createMcpClient();
async function q(sql: string) {
  const r = await client.callTool({ name: 'query', arguments: { sql } });
  const c = r.content as Array<{type:string;text:string}>;
  const p = JSON.parse(c[0].text);
  return Array.isArray(p) ? p : p.rows ?? [];
}

// Sample recent anf_timestamp and op_datum
console.log('=== Recent anf_timestamp (Anfragen) ===');
const anf = await q(`SELECT anf_timestamp, vog_status_name, vog_akww FROM mcp_vorgaenge WHERE anf_timestamp IS NOT NULL ORDER BY anf_timestamp DESC LIMIT 10`);
anf.forEach((r: any) => console.log(r.anf_timestamp, '|', r.vog_status_name));

console.log('\n=== Recent op_datum (Buchungen) ===');
const op = await q(`SELECT op_datum, vog_status_name, op_rechbetrag FROM mcp_vorgaenge WHERE op_datum IS NOT NULL AND vog_status_name IN ('booking','Buchung','online booking','Onlinebuchung') ORDER BY op_datum DESC LIMIT 10`);
op.forEach((r: any) => console.log(r.op_datum, '|', r.vog_status_name, '|', r.op_rechbetrag));

console.log('\n=== Anfragen pro Tag diese Woche (ISO Mo-So) ===');
const woche = await q(`SELECT DATE(anf_timestamp) as tag, COUNT(*) as cnt FROM mcp_vorgaenge WHERE YEARWEEK(anf_timestamp,1) = YEARWEEK(CURDATE(),1) GROUP BY DATE(anf_timestamp) ORDER BY tag`);
woche.forEach((r: any) => console.log(r.tag, '→', r.cnt, 'Anfragen'));

console.log('\n=== Anfragen pro Tag (Sa 04.04 - heute) ===');
const wocheSa = await q(`SELECT DATE(anf_timestamp) as tag, COUNT(*) as cnt FROM mcp_vorgaenge WHERE DATE(anf_timestamp) BETWEEN '2026-04-04' AND CURDATE() GROUP BY DATE(anf_timestamp) ORDER BY tag`);
wocheSa.forEach((r: any) => console.log(r.tag, '→', r.cnt, 'Anfragen'));

await client.close();
