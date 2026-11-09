-- A finding can affect several shops/months. Count it once within each group.
-- Group sums are not a global distinct-finding total. Missing dates stay Unknown.
SELECT r.snapshot,r.shop,COALESCE(r.month,'Unknown') month,f.severity,f.code,COUNT(DISTINCT f.identity) open_findings
FROM findings f JOIN finding_refs r USING(snapshot,identity)
WHERE f.reviewed=0
GROUP BY r.snapshot,r.shop,r.month,f.severity,f.code
ORDER BY r.snapshot,r.shop,month,f.severity,f.code;
