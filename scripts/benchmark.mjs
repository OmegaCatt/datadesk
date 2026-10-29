import { performance } from 'node:perf_hooks';
import { reconcile } from '../web/engine.mjs';
import { makeDataset } from '../web/datasets.mjs';
for (const size of [1000, 10000, 20000]) {
  const { orders, shipments } = makeDataset(size);
  const timings = [];
  for (let run = 0; run < 6; run++) {
    const begin = performance.now(); const result = reconcile(orders, shipments); const duration = performance.now() - begin;
    if (result.findings.length || result.stats.matchedOrders !== size) throw new Error('Unexpected benchmark reconciliation result.');
    if (run) timings.push(duration);
  }
  timings.sort((a, b) => a - b);
  console.log(JSON.stringify({ orders: size, shipments: size, samples: timings.length, medianMs: Number(timings[2].toFixed(2)), minMs: Number(timings[0].toFixed(2)), maxMs: Number(timings.at(-1).toFixed(2)), node: process.version }));
}
const duplicateData = makeDataset(20000);
for (const order of duplicateData.orders) { order.shop = 'SAME'; order.order_id = 'SAME'; }
for (const shipment of duplicateData.shipments) { shipment.shop = 'SAME'; shipment.order_id = 'SAME'; shipment.shipment_id = 'SAME'; }
const duplicateStart = performance.now();
const duplicateResult = reconcile(duplicateData.orders, duplicateData.shipments);
const duplicateMs = performance.now() - duplicateStart;
if (duplicateResult.stats.cleanOrders !== 0 || duplicateResult.stats.matchedOrders !== 0) throw new Error('Unexpected duplicate-heavy result.');
console.log(JSON.stringify({ scenario: 'duplicate-heavy', orders: 20000, shipments: 20000, durationMs: Number(duplicateMs.toFixed(2)), node: process.version }));
