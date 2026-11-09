"""Verified DataDesk cases -> recomputed Node findings -> transparent SQL reports."""
import argparse
import csv
import hashlib
import io
import json
import os
import sqlite3
import subprocess
from pathlib import Path

ROOT=Path(__file__).resolve().parent

def recompute(file):
    result=subprocess.run([os.environ.get('DATADESK_NODE','node'),str(ROOT.parent/'scripts/analytics-input.mjs'),str(file)],capture_output=True,text=True,encoding='utf-8',timeout=30)
    if result.returncode:raise ValueError('Case verification failed: '+result.stderr[:300].strip())
    return json.loads(result.stdout)

def identity(finding):
    # Omit physical positions only. Date-format metadata changes interpretation.
    records=[{'source':r['source'],'raw':{k:v for k,v in r['raw'].items() if k!='__line'}} for r in finding['rows']]
    canonical=json.dumps({'code':finding['code'],'records':sorted(records,key=lambda r:json.dumps(r,sort_keys=True,ensure_ascii=False))},sort_keys=True,ensure_ascii=False,separators=(',',':'))
    return hashlib.sha256(canonical.encode()).hexdigest()

def analyze(after,before=None):
    snapshots={'after':recompute(after)}
    if before:snapshots['before']=recompute(before)
    with sqlite3.connect(':memory:') as db:
        db.row_factory=sqlite3.Row
        db.executescript('''CREATE TABLE orders(snapshot TEXT,shop TEXT,order_id TEXT,ordered_date TEXT,cents INTEGER,currency TEXT,source_row INTEGER);
          CREATE TABLE findings(snapshot TEXT,identity TEXT,code TEXT,severity TEXT,reviewed INTEGER,PRIMARY KEY(snapshot,identity));
          CREATE TABLE finding_refs(snapshot TEXT,identity TEXT,shop TEXT,month TEXT);
          CREATE INDEX order_key ON orders(snapshot,shop,order_id);
          CREATE INDEX finding_key ON finding_refs(snapshot,identity);''')
        for name,data in snapshots.items():
            month_index={}
            for row in data['orders']:
                db.execute('INSERT INTO orders VALUES(?,?,?,?,?,?,?)',(name,row['shop'],row['id'],row['date'],row['cents'],row['currency'],row['sourceRow']))
                month_index.setdefault((row['shop'],row['id']),set()).add(row['date'][:7] if row['date'] else None)
            occurrences={}
            for finding in data['findings']:
                base=identity(finding);occurrences[base]=occurrences.get(base,0)+1;key=base+'-'+str(occurrences[base])
                db.execute('INSERT OR IGNORE INTO findings VALUES(?,?,?,?,?)',(name,key,finding['code'],finding['severity'],finding['reviewed']))
                for ref in finding['rows']:
                    # Ambiguous dates must not be silently attributed to one month.
                    months=month_index.get((ref['shop'],str(ref['raw'].get('order_id','')).strip()),set())
                    month=next(iter(months)) if len(months)==1 else None
                    db.execute('INSERT INTO finding_refs VALUES(?,?,?,?)',(name,key,ref['shop'],month))
        result={name:[dict(row) for row in db.execute((ROOT/(name+'.sql')).read_text(encoding='utf-8'))] for name in ['monthly','queue']+(['transitions'] if before else [])}
        result['fingerprints']={name:data['fingerprint'] for name,data in snapshots.items()}
        return result

def csv_text(rows,columns):
    output=io.StringIO(newline='');writer=csv.writer(output,delimiter=';');writer.writerow(columns)
    for row in rows:
        values=[]
        for col in columns:
            value=row[col]
            if isinstance(value,str) and value.lstrip().startswith(('=','+','-','@')):value="'"+value
            values.append(value)
        writer.writerow(values)
    return output.getvalue()

def main():
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('after',type=Path);parser.add_argument('--before',type=Path);parser.add_argument('--output-dir',type=Path,default=Path('analytics-output'));args=parser.parse_args()
    report=analyze(args.after,args.before);args.output_dir.mkdir(parents=True,exist_ok=True)
    columns={'monthly':['snapshot','shop','month','currency','unique_orders','amount_minor'],'queue':['snapshot','shop','month','severity','code','open_findings'],'transitions':['change','identity','code','severity','reviewed']}
    for name,fields in columns.items():
        if name in report:
            with (args.output_dir/(name+'.csv')).open('w',encoding='utf-8-sig',newline='') as stream:stream.write(csv_text(report[name],fields))
    (args.output_dir/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print('SQL report regenerated: '+str(args.output_dir))

if __name__=='__main__':main()
