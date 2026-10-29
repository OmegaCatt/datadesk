import { readFile, writeFile } from 'node:fs/promises';
import { reconcile, parseCSV } from '../web/engine.mjs';
import { getScenario } from '../web/datasets.mjs';
const args = process.argv.slice(2);
try {
  if (args.length !== 0 && args.length !== 2 && args.length !== 3) throw new Error('Usage: node scripts/cli.mjs [orders.csv shipments.csv [report.json]]');
  const data = args.length ? { orders: parseCSV(await readFile(args[0], 'utf8')), shipments: parseCSV(await readFile(args[1], 'utf8')) } : getScenario('issues');
  const report = reconcile(data.orders, data.shipments);
  if (args[2]) { await writeFile(args[2], JSON.stringify(report, null, 2)); console.log('Report written to ' + args[2]); }
  else console.log(JSON.stringify(report, null, 2));
} catch (error) { console.error(error.message); process.exitCode = 1; }
