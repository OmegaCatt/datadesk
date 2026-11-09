-- Finding identity uses code and sorted source business records, not row position.
-- Review is triage; it never turns a source defect into a resolved finding.
SELECT 'new' change,b.identity,b.code,b.severity,b.reviewed FROM findings b
WHERE b.snapshot='after' AND NOT EXISTS(SELECT 1 FROM findings a WHERE a.snapshot='before' AND a.identity=b.identity)
UNION ALL
SELECT 'resolved',a.identity,a.code,a.severity,a.reviewed FROM findings a
WHERE a.snapshot='before' AND NOT EXISTS(SELECT 1 FROM findings b WHERE b.snapshot='after' AND b.identity=a.identity)
UNION ALL
SELECT CASE WHEN a.reviewed<>b.reviewed THEN 'review_changed' ELSE 'unchanged' END,b.identity,b.code,b.severity,b.reviewed
FROM findings a JOIN findings b ON a.identity=b.identity WHERE a.snapshot='before' AND b.snapshot='after'
ORDER BY change,identity;
