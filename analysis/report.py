"""Rebuild a documented SQL report from a DataDesk case; Python stdlib only."""
import argparse
import csv
import io
import json
import re
import sqlite3
from pathlib import Path

ROOT = Path(__file__).resolve().parent

def coverage(case):
    if case.get('format') != 'datadesk-case' or case.get('version') != 1:
        raise ValueError('Expected a DataDesk case v1')
    for key in ('orders', 'shipments'):
        rows = case.get(key)
        if not isinstance(rows, list) or not 0 < len(rows) <= 20000:
            raise ValueError('Invalid row count')
        if any(not isinstance(row, dict) or not all(isinstance(row.get(k), str) and len(row[k]) <= 500 for k in ('shop','order_id')) for row in rows):
            raise ValueError('Invalid identifier')
    with sqlite3.connect(':memory:') as db:
        db.row_factory = sqlite3.Row
        for table in ('orders','shipments'):
            db.execute(f'CREATE TABLE {table}(shop TEXT NOT NULL, order_id TEXT NOT NULL)')
            db.executemany(f'INSERT INTO {table} VALUES (?,?)', [(r['shop'].strip(),r['order_id'].strip()) for r in case[table]])
            db.execute(f'CREATE INDEX idx_{table} ON {table}(shop,order_id)')
        return [dict(row) for row in db.execute((ROOT/'coverage.sql').read_text(encoding='utf-8'))]

def report_csv(rows):
    output=io.StringIO(newline='')
    writer=csv.writer(output,delimiter=';')
    writer.writerow(['shop','unique_orders','matched_orders','without_shipment'])
    for row in rows:
        shop=row['shop']
        if re.match(r'^[\s\x00-\x1f]*[=+\-@]',shop): shop="'"+shop
        writer.writerow([shop,row['unique_orders'],row['matched_orders'],row['without_shipment']])
    return output.getvalue()

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('case',type=Path)
    parser.add_argument('--output',type=Path,default=Path('coverage.csv'))
    args=parser.parse_args()
    if args.case.stat().st_size>8_000_000: parser.error('Case limit is 8 MB')
    result=coverage(json.loads(args.case.read_text(encoding='utf-8-sig')))
    with args.output.open('w',encoding='utf-8-sig',newline='') as output:
        output.write(report_csv(result))
    print(json.dumps(result,ensure_ascii=False,indent=2))
