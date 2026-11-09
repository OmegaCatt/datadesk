-- Date is normalized by the JS engine. Exclude ALL ambiguous shop+ID groups.
-- Invalid dates/amounts are excluded explicitly; currencies are never combined.
WITH counts AS(SELECT snapshot,shop,order_id,COUNT(*) copies FROM orders GROUP BY snapshot,shop,order_id)
SELECT o.snapshot,o.shop,substr(o.ordered_date,1,7) month,o.currency,
 COUNT(*) unique_orders,SUM(o.cents) amount_minor
FROM orders o JOIN counts c USING(snapshot,shop,order_id)
WHERE c.copies=1 AND o.shop<>'' AND o.order_id<>'' AND o.ordered_date IS NOT NULL
 AND o.cents IS NOT NULL AND o.currency IN ('CZK','EUR','USD')
GROUP BY o.snapshot,o.shop,month,o.currency ORDER BY o.snapshot,o.shop,month,o.currency;
