import unittest,tempfile,json,hashlib,subprocess,sys
from pathlib import Path
from analyze import analyze,csv_text

def make_case(path,orders,shipments,reviews=None):
    source={'orders':orders,'shipments':shipments}
    fingerprint=hashlib.sha256(json.dumps(source,ensure_ascii=False,separators=(',',':')).encode()).hexdigest()
    payload={'format':'datadesk-case','version':1,'engineVersion':'0.1.0','names':['a.csv','b.csv'],**source,'fingerprint':fingerprint,'reviews':reviews or {},'history':[]}
    path.write_text(json.dumps(payload,ensure_ascii=False),encoding='utf-8')

def order(id,amount='100',currency='CZK',date='2026-04-03'):
    return dict(order_id=id,shop='A',customer='Fiktivní',email='a@example.com',ordered_at=date,amount=amount,currency=currency,quantity='1')
def shipment(id):return dict(shipment_id='S'+id,shop='A',order_id=id,shipped_at='2026-04-04',quantity='1',carrier='Demo')

class AnalysisTests(unittest.TestCase):
    def test_monthly_excludes_duplicates_and_invalid_amounts_without_mixing_currencies(self):
        with tempfile.TemporaryDirectory() as folder:
            source=Path(folder)/'case.json'
            rows=[order('1'),order('2','10','EUR'),order('dup'),order('dup'),order('bad','bad'),order('date',date='bad')]
            make_case(source,rows,[shipment('1')]);result=analyze(source)
            self.assertEqual(result['monthly'],[{'snapshot':'after','shop':'A','month':'2026-04','currency':'CZK','unique_orders':1,'amount_minor':10000},{'snapshot':'after','shop':'A','month':'2026-04','currency':'EUR','unique_orders':1,'amount_minor':1000}])
            self.assertTrue(any(row['month']=='Unknown' for row in result['queue']))
    def test_reordering_source_rows_does_not_invent_new_or_resolved_findings(self):
        with tempfile.TemporaryDirectory() as folder:
            before,after=[Path(folder)/name for name in ['before.json','after.json']]
            make_case(before,[order('1'),order('2')],[shipment('1')]);make_case(after,[order('2'),order('1')],[shipment('1')])
            self.assertEqual([row['change'] for row in analyze(after,before)['transitions']],['unchanged'])
    def test_resolved_finding_is_not_confused_with_reviewed_finding(self):
        with tempfile.TemporaryDirectory() as folder:
            before,after=[Path(folder)/name for name in ['before.json','after.json']]
            rows=[order('1'),order('2')];make_case(before,rows,[shipment('1')]);make_case(after,rows,[shipment('1'),shipment('2')])
            self.assertEqual([row['change'] for row in analyze(after,before)['transitions']],['resolved'])
    def test_invalid_fingerprint_is_rejected_and_cli_writes_real_reports(self):
        with tempfile.TemporaryDirectory() as folder:
            source=Path(folder)/'case.json';output=Path(folder)/'out';make_case(source,[order('1')],[shipment('1')])
            subprocess.run([sys.executable,str(Path(__file__).with_name('analyze.py')),str(source),'--output-dir',str(output)],check=True,capture_output=True)
            self.assertTrue((output/'monthly.csv').read_text(encoding='utf-8-sig').startswith('snapshot;shop;month;currency;'))
            payload=json.loads(source.read_text(encoding='utf-8'));payload['orders'][0]['amount']='200';source.write_text(json.dumps(payload),encoding='utf-8')
            with self.assertRaises(ValueError):analyze(source)
    def test_spreadsheet_safe_shop_and_exact_date_interpretation(self):
        self.assertIn("'=bad",csv_text([{'shop':'=bad'}],['shop']))
        with tempfile.TemporaryDirectory() as folder:
            source=Path(folder)/'case.json';row=order('1',date='03/04/2026');row['__dateFormat']='dmy-slash';make_case(source,[row],[shipment('1')])
            self.assertEqual(analyze(source)['monthly'][0]['month'],'2026-04')
