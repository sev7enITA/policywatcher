#!/usr/bin/env python3
"""Build the vector figures supplied with the PolicyWatcher SoftwareX paper."""

from pathlib import Path

from reportlab.lib.colors import HexColor, white
from reportlab.lib.units import cm, inch
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.pdfgen import canvas


ROOT = Path(__file__).resolve().parent
FIGURES = ROOT / "figures"

NAVY = HexColor("#17223B")
BLUE = HexColor("#2F5DA8")
CYAN = HexColor("#3A86A8")
GREEN = HexColor("#2B7A66")
AMBER = HexColor("#B56B18")
RED = HexColor("#A13D3D")
PALE_BLUE = HexColor("#EAF1FB")
PALE_GREEN = HexColor("#E9F5F0")
PALE_AMBER = HexColor("#FFF2DF")
PALE_RED = HexColor("#FBECEC")
LINE = HexColor("#93A0B5")
TEXT = HexColor("#1D2636")
MUTED = HexColor("#56647A")


def rounded_box(c, x, y, w, h, title, lines, fill, stroke=LINE, title_color=NAVY):
    c.setFillColor(fill)
    c.setStrokeColor(stroke)
    c.setLineWidth(0.8)
    c.roundRect(x, y, w, h, 7, stroke=1, fill=1)
    c.setFillColor(title_color)
    c.setFont("Helvetica-Bold", 9.4)
    c.drawCentredString(x + w / 2, y + h - 16, title)
    c.setFillColor(TEXT)
    c.setFont("Helvetica", 7.7)
    baseline = y + h - 30
    for line in lines:
        c.drawCentredString(x + w / 2, baseline, line)
        baseline -= 10


def arrow(c, x1, y1, x2, y2, color=LINE, width=1.2, label=None):
    c.setStrokeColor(color)
    c.setFillColor(color)
    c.setLineWidth(width)
    c.line(x1, y1, x2, y2)
    angle_size = 5
    if abs(x2 - x1) >= abs(y2 - y1):
        direction = 1 if x2 >= x1 else -1
        c.line(x2, y2, x2 - direction * angle_size, y2 + 3)
        c.line(x2, y2, x2 - direction * angle_size, y2 - 3)
    else:
        direction = 1 if y2 >= y1 else -1
        c.line(x2, y2, x2 + 3, y2 - direction * angle_size)
        c.line(x2, y2, x2 - 3, y2 - direction * angle_size)
    if label:
        c.setFont("Helvetica", 6.8)
        c.setFillColor(MUTED)
        tx = (x1 + x2) / 2 - stringWidth(label, "Helvetica", 6.8) / 2
        c.drawString(tx, (y1 + y2) / 2 + 4, label)


def architecture(path):
    width, height = 7.35 * inch, 4.05 * inch
    c = canvas.Canvas(str(path), pagesize=(width, height))
    c.setTitle("PolicyWatcher evidence-preserving architecture")

    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 13)
    c.drawString(24, height - 23, "PolicyWatcher evidence-preserving architecture")
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 7.6)
    c.drawRightString(width - 24, height - 36, "Every public record must retain retrieval provenance")

    y = 154
    h = 78
    w = 90
    gap = 10
    x0 = 18
    rounded_box(c, x0, y, w, h, "1. Sources", ["Provider pages", "Regional variants", "Public archives"], PALE_BLUE)
    x1 = x0 + w + gap
    rounded_box(c, x1, y, w, h, "2. Acquisition", ["HTTP/1.1 + HTTP/2", "Optional renderer", "Fresh archives"], PALE_BLUE, title_color=BLUE)
    x2 = x1 + w + gap
    rounded_box(c, x2, y, w, h, "3. Validation", ["Block-page checks", "Extraction + drift", "SSRF protection"], PALE_GREEN, title_color=GREEN)
    x3 = x2 + w + gap
    rounded_box(c, x3, y, w, h, "4. Evidence store", ["Normalized text", "Hash + immutable diff", "Check provenance"], PALE_GREEN, title_color=GREEN)
    x4 = x3 + w + gap
    rounded_box(c, x4, y, w, h, "5. Public gate", ["Evidence status", "Fixture exclusion", "Suspend uncertainty"], PALE_AMBER, title_color=AMBER)

    for left in (x0, x1, x2, x3):
        arrow(c, left + w, y + h / 2, left + w + gap - 2, y + h / 2)

    out_y = 54
    out_h = 52
    out_w = 116
    rounded_box(c, 72, out_y, out_w, out_h, "Research outputs", ["Versioned corpus", "Retrieval-path logs"], PALE_BLUE)
    rounded_box(c, 210, out_y, out_w, out_h, "Public outputs", ["Timeline + comparison", "Bilingual explanations"], PALE_GREEN)
    rounded_box(c, 348, out_y, out_w, out_h, "Explicit withholding", ["Minimal suspension notice", "No text, score, or alert"], PALE_RED, title_color=RED)

    arrow(c, x4 + w / 2, y, 268, out_y + out_h, GREEN, label="admitted")
    arrow(c, x4 + w / 2 + 4, y, 406, out_y + out_h, RED, label="uncertain")
    arrow(c, x3 + w / 2, y, 130, out_y + out_h, BLUE, label="reusable evidence")

    c.setStrokeColor(LINE)
    c.setDash(3, 3)
    c.line(406, out_y, 406, 31)
    c.line(406, 31, x1 + w / 2, 31)
    c.line(x1 + w / 2, 31, x1 + w / 2, y - 6)
    c.setDash()
    c.setFillColor(MUTED)
    c.setFont("Helvetica-Oblique", 6.8)
    c.drawCentredString(285, 20, "Suspended sources remain scheduled for bounded retry and manual review")

    c.showPage()
    c.save()


def illustrative_workflow(path):
    width, height = 7.35 * inch, 3.75 * inch
    c = canvas.Canvas(str(path), pagesize=(width, height))
    c.setTitle("Illustrative policy-check workflow")

    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 14)
    c.drawString(24, height - 24, "Illustrative policy-check workflow")
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 7.5)
    c.drawRightString(width - 24, height - 22, "One scheduled document check; three honest outcomes")

    start_x = 25
    top_y = 158
    bw, bh = 104, 52
    rounded_box(c, start_x, top_y, bw, bh, "Configured document", ["Official URL", "Last live baseline"], PALE_BLUE)
    rounded_box(c, 168, top_y, bw, bh, "Retrieval cascade", ["Live paths first", "Fresh archives last"], PALE_BLUE, title_color=BLUE)
    rounded_box(c, 311, top_y, bw, bh, "Content contract", ["ok / invalid", "unavailable"], PALE_GREEN, title_color=GREEN)
    arrow(c, start_x + bw, top_y + bh / 2, 166, top_y + bh / 2)
    arrow(c, 168 + bw, top_y + bh / 2, 309, top_y + bh / 2)

    ok_x, invalid_x, unavailable_x = 25, 199, 373
    out_y, out_w, out_h = 55, 132, 62
    rounded_box(c, ok_x, out_y, out_w, out_h, "OK: evidence", ["Normalize and hash", "Store provenance"], PALE_GREEN, title_color=GREEN)
    rounded_box(c, invalid_x, out_y, out_w, out_h, "Invalid content", ["Challenge, soft 404,", "redirect drift"], PALE_AMBER, title_color=AMBER)
    rounded_box(c, unavailable_x, out_y, out_w, out_h, "Unavailable", ["All admissible", "paths exhausted"], PALE_RED, title_color=RED)

    arrow(c, 363, top_y, ok_x + out_w / 2, out_y + out_h, GREEN, label="valid text")
    arrow(c, 363, top_y, invalid_x + out_w / 2, out_y + out_h, AMBER, label="wrong content")
    arrow(c, 363, top_y, unavailable_x + out_w / 2, out_y + out_h, RED, label="no evidence")

    c.setFillColor(TEXT)
    c.setFont("Helvetica-Bold", 7.7)
    c.drawCentredString(ok_x + out_w / 2, 38, "Changed -> immutable diff + analysis")
    c.drawCentredString(invalid_x + out_w / 2, 38, "Withhold; retain diagnostic")
    c.drawCentredString(unavailable_x + out_w / 2, 38, "Withhold; publish notice only")
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 6.7)
    c.drawCentredString(ok_x + out_w / 2, 27, "Unchanged -> check log only")
    c.drawCentredString(invalid_x + out_w / 2, 27, "Never promote page text")
    c.drawCentredString(unavailable_x + out_w / 2, 27, "Never publish stale fallback")

    c.showPage()
    c.save()


def graphical_abstract(path):
    width, height = 13 * cm, 5 * cm
    c = canvas.Canvas(str(path), pagesize=(width, height))
    c.setTitle("PolicyWatcher graphical abstract")
    c.setFillColor(NAVY)
    c.rect(0, 0, width, height, stroke=0, fill=1)
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 14)
    c.drawString(16, height - 24, "PolicyWatcher")
    c.setFont("Helvetica", 7.5)
    c.drawString(16, height - 36, "Evidence-preserving monitoring of online policies")

    y, h, w = 33, 46, 66
    xs = [16, 94, 172, 250]
    titles = ["Acquire", "Validate", "Preserve", "Publish"]
    subtitles = ["5 retrieval paths", "content + egress", "hash + provenance", "only verified data"]
    fills = [BLUE, CYAN, GREEN, AMBER]
    for idx, x in enumerate(xs):
        c.setFillColor(fills[idx])
        c.roundRect(x, y, w, h, 5, stroke=0, fill=1)
        c.setFillColor(white)
        c.setFont("Helvetica-Bold", 8.5)
        c.drawCentredString(x + w / 2, y + 28, titles[idx])
        c.setFont("Helvetica", 5.8)
        c.drawCentredString(x + w / 2, y + 15, subtitles[idx])
        if idx < len(xs) - 1:
            arrow(c, x + w, y + h / 2, xs[idx + 1] - 3, y + h / 2, white, 1.0)

    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 7.2)
    c.drawRightString(width - 16, 14, "Uncertain evidence is withheld, not guessed")
    c.showPage()
    c.save()


def main():
    FIGURES.mkdir(parents=True, exist_ok=True)
    architecture(FIGURES / "architecture.pdf")
    illustrative_workflow(FIGURES / "illustrative-workflow.pdf")
    graphical_abstract(ROOT / "submission" / "graphical-abstract.pdf")
    print("Built SoftwareX vector figures")


if __name__ == "__main__":
    main()
