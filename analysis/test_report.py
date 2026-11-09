import unittest
import subprocess,sys,tempfile,csv,json
from pathlib import Path
from report import coverage,report_csv

class ReportTests(unittest.TestCase):
    def test_duplicates_are_excluded_and_repeated_shipments_do_not_multiply(self):
        case={'format':'datadesk-case','version':1,
              'orders':[{'shop':'A','order_id':x} for x in ['001','002','dup','dup']]+[{'shop':'B','order_id':'001'}],
              'shipments':[{'shop':'A','order_id':'001'}]*3+[{'shop':'B','order_id':'other'}]}
        self.assertEqual(coverage(case),[
            {'shop':'A','unique_orders':2,'matched_orders':1,'without_shipment':1},
            {'shop':'B','unique_orders':1,'matched_orders':0,'without_shipment':1}])
    def test_csv_is_spreadsheet_safe(self):
        self.assertIn("'=1",report_csv([{'shop':'=1','unique_orders':1,'matched_orders':0,'without_shipment':1}]))
    def test_invalid_source_is_rejected(self):
        with self.assertRaises(ValueError): coverage({'format':'datadesk-case','version':1,'orders':[],'shipments':[]})
    def test_cli_csv_has_no_blank_records_on_windows(self):
        with tempfile.TemporaryDirectory() as directory:
            source=Path(directory)/'case.json';output=Path(directory)/'coverage.csv'
            source.write_text(json.dumps({'format':'datadesk-case','version':1,'orders':[{'shop':'A','order_id':'001'}],'shipments':[{'shop':'A','order_id':'001'}]}),encoding='utf-8')
            subprocess.run([sys.executable,str(Path(__file__).with_name('report.py')),str(source),'--output',str(output)],check=True,capture_output=True)
            with output.open(encoding='utf-8-sig',newline='') as stream: rows=list(csv.reader(stream,delimiter=';'))
            self.assertEqual(rows,[['shop','unique_orders','matched_orders','without_shipment'],['A','1','1','0']])

if __name__=='__main__': unittest.main()
