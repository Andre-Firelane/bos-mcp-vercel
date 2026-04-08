import 'dotenv/config';
import { createMcpClient, listAvailableTools } from './mcp-client.js';
import { KPI_FETCHERS } from './kpi-fetcher.js';
import { upsertKpis } from './supabase-writer.js';

async function main() {
  console.log(`[importer] Starting BOS KPI import run at ${new Date().toISOString()}`);

  const client = await createMcpClient();
  console.log('[importer] Connected to BOS MCP server');

  // Discovery mode: list all available tools and exit without inserting
  if (process.env.LIST_TOOLS === 'true') {
    const tools = await listAvailableTools(client);
    console.log('\n[importer] Available BOS MCP tools:\n');
    tools.forEach((t) => {
      console.log(`  • ${t.name}`);
      if (t.description) console.log(`    ${t.description}`);
    });
    console.log('\n[importer] Add fetchers for these tools in src/kpi-fetcher.ts');
    await client.close();
    return;
  }

  if (KPI_FETCHERS.length === 0) {
    console.warn(
      '[importer] No KPI fetchers configured. ' +
      'Run "npm run discover" to see available tools, then add fetchers to src/kpi-fetcher.ts'
    );
    await client.close();
    return;
  }

  // Run all fetchers in parallel, isolating failures
  const results = await Promise.allSettled(
    KPI_FETCHERS.map((fetcher) => fetcher(client))
  );

  const successful = results
    .filter((r): r is PromiseFulfilledResult<Awaited<ReturnType<typeof KPI_FETCHERS[0]>>> =>
      r.status === 'fulfilled'
    )
    .map((r) => r.value);

  const failed = results.filter((r) => r.status === 'rejected');
  failed.forEach((r) => {
    if (r.status === 'rejected') {
      console.error('[importer] Fetcher error:', r.reason);
    }
  });

  if (successful.length > 0) {
    await upsertKpis(successful);
  }

  await client.close();
  console.log(
    `[importer] Done. ${successful.length}/${KPI_FETCHERS.length} KPI(s) imported successfully.`
  );

  if (failed.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error('[importer] Fatal error:', err);
  process.exit(1);
});
