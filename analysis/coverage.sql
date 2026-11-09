-- One result per shop. A match means a shipment references a unique nonempty
-- order ID within that shop. It does NOT assert correct quantity or delivery.
WITH grouped AS (
 SELECT shop, order_id, COUNT(*) AS copies
 FROM orders GROUP BY shop, order_id
), unique_orders AS (
 SELECT shop, order_id FROM grouped
 WHERE copies=1 AND trim(shop)<>'' AND trim(order_id)<>''
)
SELECT u.shop,
 COUNT(*) AS unique_orders,
 SUM(EXISTS(SELECT 1 FROM shipments s
   WHERE s.shop=u.shop AND s.order_id=u.order_id)) AS matched_orders,
 SUM(NOT EXISTS(SELECT 1 FROM shipments s
   WHERE s.shop=u.shop AND s.order_id=u.order_id)) AS without_shipment
FROM unique_orders u GROUP BY u.shop ORDER BY u.shop;
