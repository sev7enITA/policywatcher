from pathlib import Path

from reportlab.graphics import renderPDF
from reportlab.graphics.barcode import qr
from reportlab.graphics.shapes import Drawing
from reportlab.lib.colors import Color, HexColor, white
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
from reportlab.platypus import Paragraph


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "output" / "pdf" / "PolicyWatcher-brochure-associazioni-consumatori-IT.pdf"
OUTPUT.parent.mkdir(parents=True, exist_ok=True)
MARK = ROOT / "public" / "press-kit" / "policywatcher-logo-mark-512.png"
WORDMARK = ROOT / "public" / "press-kit" / "policywatcher-wordmark-dark-2400x600.png"
PORTRAIT = ROOT / "public" / "press-kit" / "fabrizio-degni-portrait-2400-source-upscale.png"

FONT_REGULAR = Path("/System/Library/Fonts/Supplemental/Arial.ttf")
FONT_BOLD = Path("/System/Library/Fonts/Supplemental/Arial Bold.ttf")
FONT_ITALIC = Path("/System/Library/Fonts/Supplemental/Arial Italic.ttf")

pdfmetrics.registerFont(TTFont("PW-Regular", str(FONT_REGULAR)))
pdfmetrics.registerFont(TTFont("PW-Bold", str(FONT_BOLD)))
pdfmetrics.registerFont(TTFont("PW-Italic", str(FONT_ITALIC)))

NAVY = HexColor("#071A33")
NAVY_2 = HexColor("#0D2849")
INK = HexColor("#10243F")
SLATE = HexColor("#53667D")
MUTED = HexColor("#7A899B")
CYAN = HexColor("#50C4D8")
MINT = HexColor("#97E2D0")
BLUE = HexColor("#6479E8")
PALE = HexColor("#EEF7F8")
PALE_BLUE = HexColor("#F1F4FC")
PALE_GRAY = HexColor("#F5F8FA")
LINE = HexColor("#DDE5EE")
WHITE_80 = HexColor("#D8E7F5")

W, H = A4
MARGIN = 46


styles = {
    "hero": ParagraphStyle(
        "hero", fontName="PW-Bold", fontSize=27.5, leading=30.5, textColor=white
    ),
    "hero_sub": ParagraphStyle(
        "hero_sub", fontName="PW-Regular", fontSize=11.2, leading=15.6, textColor=WHITE_80
    ),
    "h1": ParagraphStyle(
        "h1", fontName="PW-Bold", fontSize=20, leading=23.5, textColor=INK
    ),
    "h2": ParagraphStyle(
        "h2", fontName="PW-Bold", fontSize=12.2, leading=15.2, textColor=INK
    ),
    "body": ParagraphStyle(
        "body", fontName="PW-Regular", fontSize=9.4, leading=13.4, textColor=INK
    ),
    "body_small": ParagraphStyle(
        "body_small", fontName="PW-Regular", fontSize=8.1, leading=11.3, textColor=SLATE
    ),
    "card_title": ParagraphStyle(
        "card_title", fontName="PW-Bold", fontSize=9.5, leading=11.6, textColor=INK
    ),
    "card_body": ParagraphStyle(
        "card_body", fontName="PW-Regular", fontSize=7.9, leading=10.6, textColor=SLATE
    ),
    "quote": ParagraphStyle(
        "quote", fontName="PW-Bold", fontSize=13.2, leading=17.2, textColor=INK
    ),
    "bio": ParagraphStyle(
        "bio", fontName="PW-Regular", fontSize=9.1, leading=13.2, textColor=INK
    ),
    "small_white": ParagraphStyle(
        "small_white", fontName="PW-Regular", fontSize=8.2, leading=11.4, textColor=white
    ),
}


def para(c, text, style, x, top, width):
    p = Paragraph(text, style)
    _, height = p.wrap(width, H)
    p.drawOn(c, x, top - height)
    return top - height


def label(c, text, x, y, color=BLUE):
    c.setFont("PW-Bold", 7.1)
    c.setFillColor(color)
    c.drawString(x, y, text.upper())


def draw_qr(c, url, x, y, size):
    widget = qr.QrCodeWidget(url)
    x1, y1, x2, y2 = widget.getBounds()
    drawing = Drawing(size, size, transform=[size / (x2 - x1), 0, 0, size / (y2 - y1), 0, 0])
    drawing.add(widget)
    renderPDF.draw(drawing, c, x, y)


def page_number(c, number, dark=False):
    c.setFont("PW-Regular", 6.7)
    c.setFillColor(HexColor("#91A7BA") if dark else MUTED)
    c.drawRightString(W - MARGIN, 15, f"0{number}")


def standard_header(c, eyebrow):
    c.setFillColor(white)
    c.rect(0, 0, W, H, stroke=0, fill=1)
    c.drawImage(ImageReader(str(WORDMARK)), MARGIN, H - 64, width=166, height=41.5, mask="auto")
    c.setFont("PW-Bold", 7.1)
    c.setFillColor(BLUE)
    c.drawRightString(W - MARGIN, H - 39, eyebrow.upper())
    c.setStrokeColor(LINE)
    c.setLineWidth(0.75)
    c.line(MARGIN, H - 78, W - MARGIN, H - 78)


def standard_footer(c, text, number):
    c.setStrokeColor(LINE)
    c.setLineWidth(0.6)
    c.line(MARGIN, 27, W - MARGIN, 27)
    c.setFont("PW-Regular", 6.5)
    c.setFillColor(MUTED)
    c.drawString(MARGIN, 15, text.upper())
    page_number(c, number)


def numbered_card(c, x, top, width, height, number, title, body, tint=PALE_BLUE):
    c.setFillColor(tint)
    c.roundRect(x, top - height, width, height, 10, stroke=0, fill=1)
    c.setFillColor(BLUE)
    c.circle(x + 19, top - 20, 11, stroke=0, fill=1)
    c.setFillColor(white)
    c.setFont("PW-Bold", 6.8)
    c.drawCentredString(x + 19, top - 22.5, number)
    para(c, title, styles["card_title"], x + 39, top - 12, width - 51)
    para(c, body, styles["card_body"], x + 39, top - 31, width - 52)


def page_one(c):
    hero_h = 350
    hero_y = H - hero_h
    c.saveState()
    clip = c.beginPath()
    clip.rect(0, hero_y, W, hero_h)
    c.clipPath(clip, stroke=0, fill=0)
    try:
        c.linearGradient(0, hero_y, W, H, (NAVY, NAVY_2, HexColor("#153A61")), (0, 0.56, 1))
    except Exception:
        c.setFillColor(NAVY)
        c.rect(0, hero_y, W, hero_h, stroke=0, fill=1)
    c.setFillAlpha(0.15)
    c.setFillColor(CYAN)
    c.circle(W - 38, H - 30, 115, stroke=0, fill=1)
    c.setFillColor(BLUE)
    c.circle(W - 138, H - 286, 91, stroke=0, fill=1)
    c.setFillAlpha(1)

    c.drawImage(ImageReader(str(MARK)), MARGIN, H - 69, width=48, height=48, mask="auto")
    c.setFillColor(white)
    c.setFont("PW-Bold", 18.2)
    c.drawString(MARGIN + 57, H - 52, "POLICYWATCHER")

    c.setFillColor(Color(1, 1, 1, alpha=0.10))
    c.roundRect(MARGIN, H - 119, 325, 22, 11, stroke=0, fill=1)
    c.setFillColor(MINT)
    c.setFont("PW-Bold", 7.15)
    c.drawString(MARGIN + 11, H - 112, "PRESENTAZIONE PER LE ASSOCIAZIONI DEI CONSUMATORI")

    y = para(
        c,
        "I contratti digitali cambiano. I cittadini quasi mai riescono a seguirli.",
        styles["hero"],
        MARGIN,
        H - 146,
        445,
    )
    para(
        c,
        "PolicyWatcher rende ispezionabili le modifiche a termini di servizio, privacy policy e dichiarazioni pubbliche sull'intelligenza artificiale.",
        styles["hero_sub"],
        MARGIN,
        y - 14,
        445,
    )
    c.restoreState()

    y = hero_y - 28
    label(c, "Il punto di partenza", MARGIN, y)
    y = para(
        c,
        "Una policy online può cambiare senza lasciare al cittadino un confronto semplice, stabile e comprensibile. PolicyWatcher prova a conservare il percorso dell'evidenza: fonte, data, versione, differenza osservata e limiti dell'analisi.",
        styles["quote"],
        MARGIN,
        y - 15,
        W - 2 * MARGIN,
    )
    y -= 25

    cards = [
        ("01", "Il problema", "Le condizioni che regolano dati, contenuti e servizi sono lunghe, distribuite e soggette a modifica."),
        ("02", "La risposta", "Un osservatorio che registra fonti pubbliche, snapshot datati e cambiamenti, senza nascondere i dati mancanti."),
        ("03", "Il valore civico", "Una base documentale da controllare, discutere e trasformare in informazione accessibile con revisione umana."),
    ]
    gap = 12
    card_w = (W - 2 * MARGIN - 2 * gap) / 3
    for i, item in enumerate(cards):
        numbered_card(c, MARGIN + i * (card_w + gap), y, card_w, 116, *item, PALE_BLUE if i != 1 else PALE)

    y -= 145
    c.setFillColor(NAVY)
    c.roundRect(MARGIN, y - 73, W - 2 * MARGIN, 73, 12, stroke=0, fill=1)
    label(c, "In una frase", MARGIN + 18, y - 18, color=MINT)
    para(
        c,
        "PolicyWatcher non decide chi ha ragione: aiuta a capire <b>quale documento è cambiato, quando, che cosa è stato osservato e quanto è verificabile</b>.",
        styles["small_white"],
        MARGIN + 18,
        y - 29,
        W - 2 * MARGIN - 36,
    )

    standard_footer(c, "PolicyWatcher / presentazione civica / 5 agosto 2026", 1)


def page_two(c):
    standard_header(c, "Come funziona / dal documento all'evidenza")
    y = H - 108
    label(c, "Un processo controllabile", MARGIN, y)
    y = para(c, "Dal testo pubblico a un cambiamento che si può verificare", styles["h1"], MARGIN, y - 14, 470)
    y -= 22

    steps = [
        ("01", "Fonte configurata", "Si seleziona una pagina pubblica: termini, privacy policy o dichiarazione di governance AI."),
        ("02", "Acquisizione", "La piattaforma prova percorsi tecnici diversi e conserva lo stato del recupero."),
        ("03", "Controllo della fonte", "Blocchi anti-bot, pagine generiche, errori e spostamenti vengono trattati come problemi di evidenza."),
        ("04", "Snapshot e differenza", "Testo normalizzato, data e hash permettono di confrontare ciò che era disponibile in momenti diversi."),
        ("05", "Lettura assistita", "L'AI può aiutare a sintetizzare; non sostituisce il documento né la revisione umana."),
        ("06", "Gate di pubblicazione", "Elementi parziali, sospesi o non verificati non diventano automaticamente affermazioni pubbliche."),
    ]
    gap_x = 14
    gap_y = 12
    card_w = (W - 2 * MARGIN - gap_x) / 2
    card_h = 91
    for i, item in enumerate(steps):
        col = i % 2
        row = i // 2
        numbered_card(
            c,
            MARGIN + col * (card_w + gap_x),
            y - row * (card_h + gap_y),
            card_w,
            card_h,
            *item,
            PALE_BLUE if (row + col) % 2 == 0 else PALE_GRAY,
        )

    y = y - 3 * (card_h + gap_y) - 7
    label(c, "Esempio semplice", MARGIN, y)
    y = para(
        c,
        "Una piattaforma modifica una clausola sul riuso dei contenuti per l'addestramento di sistemi AI.",
        styles["h2"],
        MARGIN,
        y - 13,
        W - 2 * MARGIN,
    )
    y -= 18

    flow = [
        ("A", "La fonte cambia"),
        ("B", "La versione viene conservata"),
        ("C", "La differenza è controllata"),
        ("D", "L'associazione valuta il significato"),
    ]
    gap = 10
    flow_w = (W - 2 * MARGIN - 3 * gap) / 4
    for i, (letter, text) in enumerate(flow):
        x = MARGIN + i * (flow_w + gap)
        c.setFillColor(PALE)
        c.roundRect(x, y - 72, flow_w, 72, 9, stroke=0, fill=1)
        c.setFillColor(CYAN)
        c.circle(x + 18, y - 19, 10, stroke=0, fill=1)
        c.setFillColor(NAVY)
        c.setFont("PW-Bold", 7)
        c.drawCentredString(x + 18, y - 21.5, letter)
        para(c, text, styles["card_title"], x + 12, y - 38, flow_w - 24)
        if i < 3:
            c.setStrokeColor(BLUE)
            c.setLineWidth(1.2)
            c.line(x + flow_w + 2, y - 36, x + flow_w + gap - 2, y - 36)

    y -= 101
    c.setFillColor(PALE_BLUE)
    c.roundRect(MARGIN, y - 58, W - 2 * MARGIN, 58, 10, stroke=0, fill=1)
    para(
        c,
        "<b>Il punto non è produrre automaticamente un giudizio.</b> È permettere a una persona competente di partire da una traccia documentale più ordinata e dichiaratamente incompleta quando le evidenze non bastano.",
        styles["body"],
        MARGIN + 16,
        y - 15,
        W - 2 * MARGIN - 32,
    )

    standard_footer(c, "Fonti pubbliche / timestamp / versioni / revisione umana", 2)


def page_three(c):
    standard_header(c, "Utilità per le associazioni dei consumatori")
    y = H - 108
    label(c, "Possibili usi", MARGIN, y)
    y = para(c, "Uno strumento da valutare insieme, non una soluzione già imposta", styles["h1"], MARGIN, y - 14, 475)
    y -= 20

    uses = [
        ("01", "Watchlist tematica", "Seguire un piccolo gruppo di servizi scelti dall'associazione: social, e-commerce, AI, streaming, cloud o telecomunicazioni."),
        ("02", "Schede per i cittadini", "Trasformare un cambiamento verificato in una spiegazione breve, con link alla fonte e data dell'osservazione."),
        ("03", "Supporto a studi e campagne", "Raccogliere evidenze longitudinali per ricerche, consultazioni, audizioni o attività di educazione digitale."),
        ("04", "Segnalazioni più strutturate", "Collegare il problema segnalato da un cittadino al testo pubblico applicabile, senza sostituire la valutazione legale."),
        ("05", "Confronto tra servizi", "Organizzare fonti e indicatori con uno schema comune, mantenendo visibili differenze e dati non disponibili."),
    ]
    for i, item in enumerate(uses):
        top = y - i * 82
        numbered_card(c, MARGIN, top, 321, 70, *item, PALE_BLUE if i % 2 == 0 else PALE_GRAY)

    right_x = 390
    right_w = W - MARGIN - right_x
    c.setFillColor(NAVY)
    c.roundRect(right_x, y, right_w, -276, 12, stroke=0, fill=1)
    label(c, "Che cosa non è", right_x + 17, y - 24, color=MINT)
    boundaries = [
        ("Non è consulenza legale", "Supporta l'analisi; non sostituisce il professionista."),
        ("Non certifica conformità", "KPI e sintesi non sono una valutazione normativa."),
        ("Non è esaustivo", "Perimetro e fonti disponibili restano espliciti."),
        ("Non prova la condotta interna", "Osserva dichiarazioni pubbliche, non pratiche interne."),
        ("Non è un oracolo AI", "Le sintesi richiedono controllo umano."),
    ]
    ty = y - 46
    for title, body in boundaries:
        ty = para(c, f"<b>{title}</b><br/>{body}", styles["small_white"], right_x + 17, ty, right_w - 34) - 8

    c.setFillColor(PALE)
    c.roundRect(right_x, y - 294, right_w, -167, 12, stroke=0, fill=1)
    label(c, "Come iniziare", right_x + 17, y - 319, color=BLUE)
    sy = y - 339
    for number, title in (("1", "Presentazione e ascolto"), ("2", "Scelta di un tema concreto"), ("3", "Eventuale test limitato")):
        c.setFillColor(BLUE)
        c.circle(right_x + 26, sy - 3, 10, stroke=0, fill=1)
        c.setFillColor(white)
        c.setFont("PW-Bold", 7)
        c.drawCentredString(right_x + 26, sy - 5.5, number)
        para(c, title, styles["card_title"], right_x + 44, sy + 4, right_w - 60)
        sy -= 44
    para(
        c,
        "Nessuna richiesta di patrocinio o endorsement nella fase iniziale.",
        styles["body_small"],
        right_x + 17,
        sy + 7,
        right_w - 34,
    )

    stats_y = 173
    label(c, "Perimetro configurato al 2 agosto 2026", MARGIN, stats_y)
    stats = (("16", "aziende"), ("6", "settori"), ("15", "KPI canonici"), ("EN / IT", "lingue editoriali"))
    gap = 9
    stat_w = (W - 2 * MARGIN - 3 * gap) / 4
    for i, (value, text) in enumerate(stats):
        x = MARGIN + i * (stat_w + gap)
        c.setFillColor(PALE_BLUE)
        c.roundRect(x, stats_y - 82, stat_w, 65, 10, stroke=0, fill=1)
        c.setFillColor(INK)
        c.setFont("PW-Bold", 17 if value != "EN / IT" else 14)
        c.drawCentredString(x + stat_w / 2, stats_y - 48, value)
        c.setFont("PW-Regular", 7.2)
        c.setFillColor(SLATE)
        c.drawCentredString(x + stat_w / 2, stats_y - 66, text)
    para(
        c,
        "I numeri descrivono l'inventario configurato e il metodo, non una copertura completa del mercato né risultati di conformità.",
        styles["body_small"],
        MARGIN,
        74,
        W - 2 * MARGIN,
    )

    standard_footer(c, "Collaborazione possibile / perimetro limitato / nessun endorsement richiesto", 3)


def page_four(c):
    standard_header(c, "Autore, responsabilità e contatti")
    y = H - 108
    label(c, "Chi c'è dietro PolicyWatcher", MARGIN, y)
    y = para(c, "Fabrizio Degni", styles["h1"], MARGIN, y - 14, 320)
    y -= 15

    portrait_size = 174
    c.saveState()
    clip = c.beginPath()
    clip.roundRect(MARGIN, y - portrait_size, portrait_size, portrait_size, 14)
    c.clipPath(clip, stroke=0, fill=0)
    c.drawImage(
        ImageReader(str(PORTRAIT)),
        MARGIN - 8,
        y - portrait_size - 5,
        width=190,
        height=190,
        preserveAspectRatio=True,
        anchor="c",
        mask="auto",
    )
    c.restoreState()

    bio_x = MARGIN + portrait_size + 24
    bio_w = W - MARGIN - bio_x
    by = y
    by = para(
        c,
        "Fabrizio Degni è il <b>creatore e maintainer di PolicyWatcher</b>, progetto civic-tech indipendente nato in Italia per rendere più ispezionabili e correggibili i cambiamenti nelle fonti policy pubbliche.",
        styles["bio"],
        bio_x,
        by,
        bio_w,
    ) - 12
    by = para(
        c,
        "Progetta e sviluppa la piattaforma e il <b>PALO Framework</b>, dedicato alla governance responsabile del ciclo di vita dell'intelligenza artificiale. Nel 2026 partecipa al paper review committee IEEE Digital Privacy / ISoPE.",
        styles["bio"],
        bio_x,
        by,
        bio_w,
    ) - 12
    para(
        c,
        "Il lavoro è documentato attraverso repository pubblico, metodologia, archivio delle release, Claim Registry, Data Room e percorsi di correzione.",
        styles["bio"],
        bio_x,
        by,
        bio_w,
    )

    y -= portrait_size + 28
    label(c, "Perché questa presentazione", MARGIN, y)
    y = para(
        c,
        "Non vi scrivo presumendo che conosciate me o PolicyWatcher, né chiedendo di condividere valutazioni già formulate. Vorrei presentare un lavoro ancora in evoluzione, ascoltare le priorità di chi tutela i consumatori e capire se esiste un caso d'uso che meriti di essere esplorato insieme.",
        styles["quote"],
        MARGIN,
        y - 14,
        W - 2 * MARGIN,
    )
    y -= 25

    left_w = 309
    c.setFillColor(PALE_BLUE)
    c.roundRect(MARGIN, y - 174, left_w, 174, 12, stroke=0, fill=1)
    label(c, "Tracce pubbliche", MARGIN + 17, y - 24)
    py = y - 44
    refs = [
        ("Piattaforma", "policywatcher.online"),
        ("Metodo e limiti", "policywatcher.online/methodology/confidence"),
        ("Repository", "github.com/sev7enITA/policywatcher"),
        ("PALO Framework", "paloframework.org"),
        ("Profilo", "linkedin.com/in/fabriziodegni"),
    ]
    for title, value in refs:
        py = para(c, f"<b>{title}</b><br/><font color='#53667D'>{value}</font>", styles["body_small"], MARGIN + 17, py, left_w - 34) - 3

    right_x = MARGIN + left_w + 17
    right_w = W - MARGIN - right_x
    c.setFillColor(PALE)
    c.roundRect(right_x, y - 174, right_w, 174, 12, stroke=0, fill=1)
    label(c, "Riferimenti esterni", right_x + 17, y - 24, color=BLUE)
    ry = y - 45
    ry = para(
        c,
        "Il progetto è stato raccontato da <b>Tom's Hardware Italia</b> e <b>Gladiatori Digitali</b> e segnalato in interventi professionali pubblici.",
        styles["body"],
        right_x + 17,
        ry,
        right_w - 34,
    ) - 13
    para(
        c,
        "Questi riferimenti documentano attenzione esterna; non costituiscono endorsement, certificazione o audit indipendente.",
        styles["body_small"],
        right_x + 17,
        ry,
        right_w - 34,
    )

    y -= 201
    c.setFillColor(NAVY)
    c.roundRect(MARGIN, y - 105, W - 2 * MARGIN, 105, 13, stroke=0, fill=1)
    draw_qr(c, "https://policywatcher.online/", MARGIN + 18, y - 87, 69)
    label(c, "Invito al confronto", MARGIN + 108, y - 27, color=MINT)
    para(
        c,
        "Se il tema è pertinente, sarei lieto di organizzare una dimostrazione di 30 minuti e ascoltare le vostre esigenze. Se non è l'ufficio giusto, sarà già utile sapere a chi presentare il progetto.",
        styles["small_white"],
        MARGIN + 108,
        y - 40,
        W - 2 * MARGIN - 130,
    )
    c.setFont("PW-Bold", 8.2)
    c.setFillColor(white)
    c.drawString(MARGIN + 108, y - 86, "info@policywatcher.online")

    # Repaint the page-four header after the portrait clipping operation. This
    # keeps the masthead deterministic across PDF renderers.
    c.drawImage(ImageReader(str(WORDMARK)), MARGIN, H - 64, width=166, height=41.5, mask="auto")
    c.setFont("PW-Bold", 7.1)
    c.setFillColor(BLUE)
    c.drawRightString(W - MARGIN, H - 39, "AUTORE, RESPONSABILITÀ E CONTATTI")
    c.setStrokeColor(LINE)
    c.setLineWidth(0.75)
    c.line(MARGIN, H - 78, W - MARGIN, H - 78)

    standard_footer(c, "Progetto indipendente / codice e metodologia pubblici / contatto aperto", 4)


def build():
    c = canvas.Canvas(str(OUTPUT), pagesize=A4)
    c.setTitle("PolicyWatcher - Presentazione per le associazioni dei consumatori")
    c.setSubject("Brochure istituzionale e proposta di dialogo civico")
    c.setAuthor("Fabrizio Degni")
    c.setCreator("PolicyWatcher")
    for page_fn in (page_one, page_two, page_three, page_four):
        page_fn(c)
        c.showPage()
    c.save()
    print(OUTPUT)


if __name__ == "__main__":
    build()
