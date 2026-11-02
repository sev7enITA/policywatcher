"""Validate the delivered trailer container and decode its final resource QRs.

Run with the media .venv (Pillow and zxing-cpp) after export. This verifies
technical properties only; editorial, listening and visual review stay separate.
"""
import argparse
import hashlib
import json
from pathlib import Path
import subprocess
import tempfile

from PIL import Image
import zxingcpp

parser = argparse.ArgumentParser()
parser.add_argument('video', type=Path)
parser.add_argument('--report', type=Path, required=True)
args = parser.parse_args()
video = args.video.resolve()
probe = json.loads(subprocess.check_output([
    'ffprobe', '-v', 'error', '-show_streams', '-show_format', '-of', 'json', str(video)
]))
v = next(s for s in probe['streams'] if s['codec_type'] == 'video')
a = [s for s in probe['streams'] if s['codec_type'] == 'audio']
expected = {
    'https://policywatcher.online',
    'https://policywatcher.online/engine-6-preview',
    'https://github.com/sev7enITA/policywatcher',
}
checks = {
    'duration_180_seconds': abs(float(probe['format']['duration']) - 180) < 0.08,
    '1920_by_1080': v['width'] == 1920 and v['height'] == 1080,
    '30_fps': v['avg_frame_rate'] in ('30/1', '30000/1000'),
    'audio_present': bool(a),
}
frames = []
with tempfile.TemporaryDirectory() as d:
    for t in (166, 170, 175, 179):
        frame = Path(d) / f'frame-{t}.png'
        subprocess.run(['ffmpeg', '-y', '-v', 'error', '-ss', str(t), '-i', str(video),
                        '-frames:v', '1', str(frame)], check=True)
        decoded = {r.text for r in zxingcpp.read_barcodes(Image.open(frame))}
        frames.append({'second': t, 'decoded': sorted(decoded),
                       'all_expected_decoded': expected <= decoded})
checks['three_qrs_readable_at_each_sample'] = all(f['all_expected_decoded'] for f in frames)
report = {
    'video': str(video), 'sha256': hashlib.sha256(video.read_bytes()).hexdigest(),
    'duration': probe['format']['duration'],
    'video_stream': {k: v.get(k) for k in ('codec_name', 'width', 'height', 'avg_frame_rate', 'nb_frames')},
    'audio_streams': [{k: s.get(k) for k in ('codec_name', 'sample_rate', 'channels', 'duration')} for s in a],
    'checks': checks, 'qr_samples': frames,
    'technical_pass': all(checks.values()),
    'human_voice_acceptance': 'separate, not established by these checks',
}
args.report.parent.mkdir(parents=True, exist_ok=True)
args.report.write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps(report, indent=2))
raise SystemExit(0 if report['technical_pass'] else 1)
