#!/usr/bin/env python3
"""Bounded, auditable repair. Dry-run by default; backup before any write."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import sqlite3
import time
import uuid

parser = argparse.ArgumentParser()
parser.add_argument('--database', required=True)
parser.add_argument('--backup-dir')
parser.add_argument('--apply', action='store_true')
args = parser.parse_args()
c = sqlite3.connect(f'file:{args.database}?mode={"rw" if args.apply else "ro"}', uri=True, timeout=30)
c.row_factory = sqlite3.Row
c.execute('PRAGMA foreign_keys=ON')
assert c.execute('PRAGMA integrity_check').fetchone()[0] == 'ok'
assert not c.execute('PRAGMA foreign_key_check').fetchall()
assert not c.execute("SELECT 1 FROM ScanRun WHERE status='running' AND completedAt IS NULL").fetchone(), 'A scan is running'
risk_rows = [dict(r) for r in c.execute('''SELECT id,overallRisk,overallScore FROM PolicyChange
 WHERE overallScore BETWEEN 1 AND 10 AND overallRisk != CASE
 WHEN overallScore >= 7 THEN 'High' WHEN overallScore >= 4 THEN 'Medium' ELSE 'Low' END''')]
bad = c.execute('''SELECT s.id,s.policyId,s.hash,s.publicEvidence,p.currentHash,p.currentText,
 p.lastSuccessfulCheckDate,p.ingestionMethod,p.sourceMigrationPending
 FROM PolicySnapshot s JOIN Policy p ON p.id=s.policyId
 WHERE s.id='4ae75985-41e9-41d9-8c44-a895c2a3da64' AND s.hash=?''',
 ('a7549952a9a34779417e0b868952aab40d52e6a0d36e847a577160b5cb091876',)).fetchone()
quarantine = bool(bad and bad['publicEvidence'])
if quarantine:
    assert "404Couldn't find this page" in bad['currentText']
    assert bad['sourceMigrationPending'] and bad['currentHash'] == bad['hash']
plan = {'riskLabelsToNormalize': len(risk_rows), 'quarantineKnown404': quarantine, 'applied': False}
if not args.apply:
    print(json.dumps(plan)); raise SystemExit(0)
assert args.backup_dir, '--backup-dir is required with --apply'
os.umask(0o077)
backup_dir = Path(args.backup_dir); backup_dir.mkdir(parents=True, exist_ok=False)
backup_path = backup_dir / 'production-before.db'
with sqlite3.connect(backup_path) as backup:
    c.backup(backup)
    assert backup.execute('PRAGMA integrity_check').fetchone()[0] == 'ok'
preserved_counts = {t: c.execute('SELECT count(*) FROM '+t).fetchone()[0] for t in ['Company','Policy','PolicySnapshot','PolicyChange','Subscriber']}
now = int(time.time()*1000)
def audit(target_type, target_id, old, new, note, change_id=None):
    c.execute('''INSERT INTO AdminReviewLog
      (id,actorRole,action,targetType,targetId,oldValue,newValue,note,metadataJson,policyChangeId,createdAt)
      VALUES(?,?,?,?,?,?,?,?,?,?,?)''', (str(uuid.uuid4()),'admin','data_consistency_repair',target_type,target_id,
      json.dumps(old),json.dumps(new),note,json.dumps({'method':'presentation-consistency-v1','userAuthorized':True}),change_id,now))
try:
    c.execute('BEGIN IMMEDIATE')
    for row in risk_rows:
        risk = 'High' if row['overallScore'] >= 7 else 'Medium' if row['overallScore'] >= 4 else 'Low'
        c.execute('UPDATE PolicyChange SET overallRisk=? WHERE id=? AND overallRisk=? AND overallScore=?',
                  (risk,row['id'],row['overallRisk'],row['overallScore']))
        assert c.execute('SELECT changes()').fetchone()[0] == 1
        audit('change',row['id'],{'overallRisk':row['overallRisk'],'overallScore':row['overallScore']},
              {'overallRisk':risk,'overallScore':row['overallScore']},
              'Derived label normalized to documented 1–3 Low, 4–6 Medium, 7–10 High scale; original AI score and narrative preserved.',row['id'])
    if quarantine:
        c.execute('UPDATE PolicySnapshot SET publicEvidence=0 WHERE id=?',(bad['id'],))
        c.execute('UPDATE Version SET publicEvidence=0 WHERE legacySnapshotId=?',(bad['id'],))
        c.execute('UPDATE PolicyChange SET publicEvidence=0,publicPublishedAt=NULL WHERE oldSnapshotId=? OR newSnapshotId=?',(bad['id'],bad['id']))
        c.execute('''UPDATE Change SET publicEvidence=0,publishedAt=NULL WHERE fromVersionId IN
          (SELECT id FROM Version WHERE legacySnapshotId=?) OR toVersionId IN
          (SELECT id FROM Version WHERE legacySnapshotId=?)''',(bad['id'],bad['id']))
        c.execute('''UPDATE Policy SET currentText='',currentHash=?,
          ingestionMethod='None',dataStatus='Unavailable' WHERE id=? AND currentHash=?''',
          (hashlib.sha256(b'').hexdigest(),bad['policyId'],bad['hash']))
        assert c.execute('SELECT changes()').fetchone()[0] == 1
        audit('policy',bad['policyId'],{'snapshotId':bad['id'],'publicEvidence':True,'currentHash':bad['hash'],
              'lastSuccessfulCheckDate':bad['lastSuccessfulCheckDate'],'ingestionMethod':bad['ingestionMethod']},
              {'publicEvidence':False,'currentText':'','currentHash':hashlib.sha256(b'').hexdigest(),'dataStatus':'Unavailable'},
              'Known TikTok 404 capture quarantined in legacy and canonical graph. Original snapshots retained privately. Replacement migration remains pending. Legacy non-null retrieval timestamp retained for audit; it is not verified-source evidence.')
    assert not c.execute('PRAGMA foreign_key_check').fetchall()
    assert preserved_counts == {t: c.execute('SELECT count(*) FROM '+t).fetchone()[0] for t in preserved_counts}
    c.commit()
except Exception:
    c.rollback(); raise
assert c.execute('PRAGMA integrity_check').fetchone()[0] == 'ok'
plan['applied'] = True
plan['backup'] = str(backup_path)
plan['preservedCounts'] = preserved_counts
(backup_dir/'repair-receipt.json').write_text(json.dumps(plan,indent=2)+'\n')
print(json.dumps(plan))
