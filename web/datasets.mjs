export function makeDataset(size = 48) {
  const customers = ['Anna Novotná', 'Petr Dvořák', 'Klára Veselá', 'Jakub Procházka', 'Eva Svobodová', 'Tomáš Marek'];
  const orders = Array.from({ length: size }, (_, i) => ({ order_id: `OBJ-${String(1041 + i).padStart(5, '0')}`, shop: i % 3 === 0 ? 'Studio sever' : 'Dílna & domov', customer: customers[i % customers.length], email: `zakaznik${i + 1}@example.com`, ordered_at: `2026-10-${String(12 + i % 12).padStart(2, '0')}`, amount: `${450 + i * 37},${i % 2 ? '50' : '00'}`, currency: i % 11 === 0 ? 'EUR' : 'CZK', quantity: String(1 + i % 4) }));
  const shipments = orders.map((o, i) => ({ shipment_id: `EXP-${3001 + i}`, shop: o.shop, order_id: o.order_id, shipped_at: `2026-10-${String(13 + i % 12).padStart(2, '0')}`, quantity: o.quantity, carrier: i % 2 ? 'Demo Parcel' : 'Fiktivní doprava' }));
  return { orders, shipments };
}
export function getScenario(id = 'issues') {
  const data = makeDataset(id === 'large' ? 10000 : 48);
  if (id !== 'clean') {
    data.orders[4].email = 'eva.example.com';
    data.orders[9].amount = '1,250.50';
    data.orders[12].ordered_at = '31.02.2026';
    data.orders[15].currency = 'KČ';
    data.orders.push({ ...data.orders[6], amount: '9 999,00' });
    data.shipments = data.shipments.filter((s, i) => ![2, 7, 18].includes(i));
    data.shipments[10].quantity = '19';
    data.shipments[14].shipped_at = '2026-10-01';
    data.shipments.push({ shipment_id: 'EXP-99999', shop: 'Studio sever', order_id: 'OBJ-NEEXISTUJE', shipped_at: '2026-10-20', quantity: '1', carrier: 'Demo Parcel' });
    data.shipments.push({ ...data.shipments[20] });
  }
  return { id, name: id === 'clean' ? 'Bezchybný export' : id === 'large' ? 'Velký export · 10 000 objednávek' : 'Říjnová kontrola', ...data };
}
export const ORDER_COLUMNS = ['order_id', 'shop', 'customer', 'email', 'ordered_at', 'amount', 'currency', 'quantity'];
export const SHIPMENT_COLUMNS = ['shipment_id', 'shop', 'order_id', 'shipped_at', 'quantity', 'carrier'];
