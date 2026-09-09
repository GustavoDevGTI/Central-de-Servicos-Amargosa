import json
import re
import unicodedata
from collections import Counter, defaultdict
from html import escape
from pathlib import Path
from urllib.parse import quote_plus, urlparse

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    FrameBreak,
    KeepInFrame,
    NextPageTemplate,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "tmp/pdf-service-gaps/pending-services.json"
ENRICHMENT_SOURCE = ROOT / "tmp/pdf-service-gaps/ba-gov-enrichment.json"
OUTPUT = ROOT / "output/pdf/servicos-amargosa-revisao-paginas-finais.pdf"

GREEN = colors.HexColor("#087449")
DEEP = colors.HexColor("#143F32")
LIGHT_GREEN = colors.HexColor("#EAF4EF")
PALE_GREEN = colors.HexColor("#F7FAF8")
GOLD = colors.HexColor("#A87400")
PALE_GOLD = colors.HexColor("#FFF8E6")
BLUE = colors.HexColor("#0969A8")
INK = colors.HexColor("#263A33")
MUTED = colors.HexColor("#61736C")
LINE = colors.HexColor("#C9D9D2")
WHITE = colors.white


def register_fonts():
    font_dir = Path("C:/Windows/Fonts")
    pdfmetrics.registerFont(TTFont("Arial", str(font_dir / "arial.ttf")))
    pdfmetrics.registerFont(TTFont("Arial-Bold", str(font_dir / "arialbd.ttf")))
    pdfmetrics.registerFont(TTFont("Georgia-Bold", str(font_dir / "georgiab.ttf")))


def clean(value):
    if value is None:
        return ""
    text = str(value).strip()
    for old, new in {"—": "-", "–": "-", "‑": "-", "vigil6ancia": "vigilância"}.items():
        text = text.replace(old, new)
    return re.sub(r"\s+", " ", text)


def split_items(value):
    return [item.strip().rstrip(".") for item in clean(value).split(";") if item.strip()]


def urls(value):
    if not value:
        return []
    return [part.strip() for part in str(value).splitlines() if part.strip().startswith("http")]


def classify_gaps(record):
    buckets = defaultdict(list)
    for item in split_items(record.get("Informação interna necessária")):
        text = item.casefold()
        if any(term in text for term in ("taxa", "custo", "forma de cálculo", "cobrança")):
            bucket = "cost"
        elif any(term in text for term in ("prazo", "agenda", "calendário")):
            bucket = "duration"
        elif any(term in text for term in ("norma", "código", "regulamento", "base normativa")):
            bucket = "legislation"
        elif any(term in text for term in ("documento", "formulário", "projeto", "art ou rrt", "anuência", "estudo", "modelo", "dados mínimos", "inscrição fiscal", "edital")):
            bucket = "documents"
        elif any(term in text for term in ("quem pode", "legitimidade", "critério", "impedimento", "prioridade")):
            bucket = "eligibility"
        elif any(term in text for term in ("canal", "horário", "escola/unidade", "unidade responsável")):
            bucket = "where"
        elif any(term in text for term in ("etapa", "protocolo", "chefia", "unidades que aprovam", "unidade decisória", "recurso", "vistoria", "medição", "tramitação", "procedimento")):
            bucket = "steps"
        else:
            bucket = "about"
        buckets[bucket].append(item)
    return buckets


def pending_text(items, fallback):
    if not items:
        return fallback
    return "A confirmar: " + "; ".join(items) + "."


def domain_link(label, url, style):
    domain = urlparse(url).netloc.replace("www.", "")
    return Paragraph(
        f'<b>{escape(label)}:</b> <link href="{escape(url, quote=True)}" color="#0969A8">{escape(domain)} - abrir</link>',
        style,
    )


def service_search_links(title):
    encoded_title = quote_plus(title)
    clean_slug = unicodedata.normalize("NFD", title)
    clean_slug = "".join(
        character for character in clean_slug
        if not unicodedata.combining(character)
    ).lower()
    clean_slug = re.sub(r"[^a-z0-9]+", "-", clean_slug).strip("-")
    return (
        "https://servicos.amargosa.ba.gov.br/"
        f"b.php?pg=o/busca_servicos&search={encoded_title}",
        "https://maisdigital.amargosa.ba.gov.br/"
        f"servicos/busca/{clean_slug}",
    )


def search_link(label, text, url, style):
    return Paragraph(
        f'<b>{escape(label)}:</b> <link href="{escape(url, quote=True)}" '
        f'color="#0969A8">{escape(text)}</link>',
        style,
    )


def eligibility_text(record, gap_items):
    specific = clean(record.get("Quem pode solicitar"))
    if specific:
        return escape(specific), True

    if gap_items:
        details = "; ".join(gap_items)
        return (
            "<font color='#A87400'><b>Não informado.</b> "
            f"É necessário confirmar: {escape(details)}.</font>"
        ), False

    return "<font color='#A87400'><b>Não informado.</b></font>", False


register_fonts()
records = json.loads(SOURCE.read_text(encoding="utf-8"))
enrichments = (
    json.loads(ENRICHMENT_SOURCE.read_text(encoding="utf-8"))
    if ENRICHMENT_SOURCE.exists()
    else {}
)

AUDIENCE_SEQUENCE = [
    ("Cidadãos; Empresas", "Cidadãos e empresas"),
    ("Cidadãos", "Somente cidadãos"),
    ("Empresas", "Somente empresas"),
    ("Servidores", "Servidores"),
]
AUDIENCE_PRIORITY = {value: index for index, (value, _) in enumerate(AUDIENCE_SEQUENCE)}


def audience_sort_key(record):
    audience = clean(record.get("Público"))
    return (
        AUDIENCE_PRIORITY.get(audience, len(AUDIENCE_PRIORITY)),
        audience.casefold(),
        clean(record.get("Serviço")).casefold(),
    )



services = json.loads((ROOT / "tmp/service-review/services.json").read_text(encoding="utf-8"))
audit = json.loads((ROOT / "tmp/service-review/audit.json").read_text(encoding="utf-8"))
by_id = {s["id"]: s for s in services}
audit_by_title = {a["originalTitle"]: a for a in audit}
seen_ids = set()
for record in records:
    entry = audit_by_title[record["Serviço"]]
    record["_service"] = by_id[entry["id"]]
    seen_ids.add(entry["id"])
for service in services:
    if service.get("slug") and service["id"] not in seen_ids:
        audience = "; ".join({"cidadao":"Cidadãos", "empresa":"Empresas", "servidor":"Servidores"}.get(a,a) for a in service.get("audienceIds", []))
        records.append({"Serviço":service["title"], "Público":audience, "Categoria atual":service["category"], "Órgão responsável":service["department"], "_service":service})
records.sort(key=audience_sort_key)
created_count = sum(bool(r["_service"].get("slug")) for r in records)


by_org = defaultdict(list)
for record in records:
    by_org[clean(record.get("Órgão responsável")) or "Órgão não informado"].append(record)

styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name="CoverKicker", fontName="Arial-Bold", fontSize=10, leading=13, textColor=GREEN, alignment=TA_CENTER, spaceAfter=7))
styles.add(ParagraphStyle(name="CoverTitle", fontName="Georgia-Bold", fontSize=22, leading=27, textColor=DEEP, alignment=TA_CENTER, spaceAfter=7))
styles.add(ParagraphStyle(name="CoverSubtitle", fontName="Arial", fontSize=9.5, leading=13, textColor=MUTED, alignment=TA_CENTER, spaceAfter=8))
styles.add(ParagraphStyle(name="CoverNumber", fontName="Georgia-Bold", fontSize=32, leading=34, textColor=GREEN, alignment=TA_CENTER, spaceAfter=0))
styles.add(ParagraphStyle(name="CoverNumberLabel", fontName="Arial-Bold", fontSize=7.8, leading=9.5, textColor=DEEP, alignment=TA_CENTER, spaceAfter=6))
styles.add(ParagraphStyle(name="CoverNote", fontName="Arial", fontSize=8, leading=11, textColor=MUTED, alignment=TA_CENTER, spaceAfter=5))
styles.add(ParagraphStyle(name="CoverSection", fontName="Georgia-Bold", fontSize=14, leading=17, textColor=DEEP, spaceAfter=5))
styles.add(ParagraphStyle(name="CoverDate", fontName="Arial", fontSize=7.2, leading=9, textColor=MUTED, alignment=TA_CENTER, spaceAfter=5))
styles.add(ParagraphStyle(name="H1", fontName="Georgia-Bold", fontSize=20, leading=24, textColor=DEEP, spaceAfter=8))
styles.add(ParagraphStyle(name="HeroAudience", fontName="Arial-Bold", fontSize=7.5, leading=10, textColor=GREEN, alignment=TA_CENTER, spaceAfter=3))
styles.add(ParagraphStyle(name="HeroTitle", fontName="Georgia-Bold", fontSize=14, leading=17, textColor=DEEP, alignment=TA_CENTER, spaceAfter=4))
styles.add(ParagraphStyle(name="HeroSummary", fontName="Arial", fontSize=8.6, leading=12, textColor=INK, alignment=TA_CENTER, spaceAfter=7))
styles.add(ParagraphStyle(name="Meta", fontName="Arial", fontSize=8, leading=11, textColor=MUTED, alignment=TA_CENTER))
styles.add(ParagraphStyle(name="Button", fontName="Arial-Bold", fontSize=9.4, leading=12, textColor=WHITE, alignment=TA_CENTER))
styles.add(ParagraphStyle(name="Section", fontName="Arial-Bold", fontSize=9, leading=10, textColor=DEEP, spaceAfter=2))
styles.add(ParagraphStyle(name="Body", fontName="Arial", fontSize=7.5, leading=9, textColor=INK, spaceAfter=1.2))
styles.add(ParagraphStyle(name="Pending", fontName="Arial", fontSize=7.5, leading=9.6, textColor=GOLD, spaceAfter=1.6))
styles.add(ParagraphStyle(name="Link", fontName="Arial", fontSize=7.1, leading=8.8, textColor=MUTED, spaceAfter=1.5))
styles.add(ParagraphStyle(name="Index", fontName="Arial", fontSize=8.5, leading=11.5, textColor=INK))
styles.add(ParagraphStyle(name="Small", fontName="Arial", fontSize=7.6, leading=10.2, textColor=MUTED))


def header_footer(canvas, doc):
    canvas.saveState()
    width, height = A4
    if doc.page > 1:
        canvas.setStrokeColor(LINE)
        canvas.setLineWidth(0.5)
        canvas.line(doc.leftMargin, height - 15 * mm, width - doc.rightMargin, height - 15 * mm)
        canvas.setFont("Arial-Bold", 7.4)
        canvas.setFillColor(GREEN)
        canvas.drawString(doc.leftMargin, height - 11.5 * mm, "CENTRAL DE SERVIÇOS - MUNICÍPIO DE AMARGOSA")
        canvas.setFont("Arial", 7.4)
        canvas.setFillColor(MUTED)
        canvas.drawRightString(width - doc.rightMargin, height - 11.5 * mm, "Fichas para complementação interna")
    canvas.setStrokeColor(LINE)
    canvas.line(doc.leftMargin, 13 * mm, width - doc.rightMargin, 13 * mm)
    canvas.setFont("Arial", 7.3)
    canvas.setFillColor(MUTED)
    canvas.drawString(doc.leftMargin, 8.8 * mm, "Estrutura alinhada ao modelo das páginas explicativas")
    canvas.drawRightString(width - doc.rightMargin, 8.8 * mm, f"Página {doc.page}")
    canvas.restoreState()


class ReportDoc(BaseDocTemplate):
    pass


OUTPUT.parent.mkdir(parents=True, exist_ok=True)
doc = ReportDoc(
    str(OUTPUT), pagesize=A4,
    leftMargin=12 * mm, rightMargin=12 * mm,
    topMargin=21 * mm, bottomMargin=18 * mm,
    title="Fichas estruturadas dos serviços pendentes - Central de Serviços de Amargosa",
    author="Central de Serviços - Município de Amargosa",
    subject="Informações disponíveis e pendências organizadas pelo modelo das páginas explicativas",
)
SERVICE_FRAME_GAP = 8 * mm
SERVICE_FRAME_HEIGHT = (doc.height - SERVICE_FRAME_GAP) / 2
SERVICE_FRAME_INNER_WIDTH = doc.width - 8 * mm
SERVICE_FRAME_INNER_HEIGHT = SERVICE_FRAME_HEIGHT - 8 * mm


def service_page(canvas, doc):
    header_footer(canvas, doc)
    canvas.saveState()
    upper_y = doc.bottomMargin + SERVICE_FRAME_HEIGHT + SERVICE_FRAME_GAP
    frame_positions = [upper_y]
    final_service_page = 1 + (len(records) + 1) // 2
    if doc.page < final_service_page or len(records) % 2 == 0:
        frame_positions.append(doc.bottomMargin)
    for y in frame_positions:
        canvas.setFillColor(WHITE)
        canvas.setStrokeColor(LINE)
        canvas.setLineWidth(0.65)
        canvas.rect(doc.leftMargin, y, doc.width, SERVICE_FRAME_HEIGHT, fill=1, stroke=1)
        canvas.setStrokeColor(GREEN)
        canvas.setLineWidth(1.4)
        canvas.line(doc.leftMargin, y + SERVICE_FRAME_HEIGHT, doc.leftMargin + doc.width, y + SERVICE_FRAME_HEIGHT)
    canvas.restoreState()


cover_frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="cover")
upper_frame = Frame(
    doc.leftMargin,
    doc.bottomMargin + SERVICE_FRAME_HEIGHT + SERVICE_FRAME_GAP,
    doc.width,
    SERVICE_FRAME_HEIGHT,
    leftPadding=4 * mm,
    rightPadding=4 * mm,
    topPadding=3 * mm,
    bottomPadding=3 * mm,
    id="service-upper",
)
lower_frame = Frame(
    doc.leftMargin,
    doc.bottomMargin,
    doc.width,
    SERVICE_FRAME_HEIGHT,
    leftPadding=4 * mm,
    rightPadding=4 * mm,
    topPadding=3 * mm,
    bottomPadding=3 * mm,
    id="service-lower",
)
doc.addPageTemplates([
    PageTemplate(id="cover", frames=[cover_frame], onPage=header_footer),
    PageTemplate(id="services", frames=[upper_frame, lower_frame], onPage=service_page),
])

story = [Spacer(1, 4 * mm)]
story.append(Paragraph("CENTRAL DE SERVIÇOS", styles["CoverKicker"]))
story.append(Paragraph("Serviços municipais<br/>Revisão das páginas finais", styles["CoverTitle"]))
story.append(Paragraph(
    "As 93 fichas do levantamento original e todas as páginas finais existentes na Central, reunidas na mesma estrutura para revisão.",
    styles["CoverSubtitle"],
))
story.append(Paragraph(str(len(records)), styles["CoverNumber"]))
story.append(Spacer(1, 2.5 * mm))
story.append(Paragraph("FICHAS PARA REVISÃO", styles["CoverNumberLabel"]))
story.append(Paragraph(
    "A tag verde “Página criada na Central” identifica as páginas existentes no projeto, inclusive as novas. A tag indica existência da página, não validação integral do conteúdo nem publicação no domínio.",
    styles["CoverNote"],
))
story.append(Paragraph("Revisão em 08/09/2026. Critério: mais de 80% = ao menos 10 dos 12 campos com dados disponíveis. Prazo indeterminado, lacunas e referências genéricas não pontuam. Onde e quando pontua com local/canal confirmado; horários ausentes permanecem sinalizados.", styles["CoverDate"]))
story.append(Spacer(1, 3 * mm))

story.append(Paragraph("Campos adotados", styles["CoverSection"]))
fields = [
    "Nome e resumo do serviço", "Públicos atendidos", "Categoria e órgão responsável",
    "O que é", "Quem pode solicitar",
    "Documentos necessários", "Como solicitar, dividido em etapas", "Onde e quando solicitar",
    "Custo", "Prazo estimado", "Links referentes", "Legislação relacionada",
]
field_rows = []
for idx in range(0, len(fields), 2):
    left = Paragraph(f"<b>{idx + 1:02d}</b> &nbsp;{escape(fields[idx])}", styles["Body"])
    right = Paragraph(f"<b>{idx + 2:02d}</b> &nbsp;{escape(fields[idx + 1])}", styles["Body"]) if idx + 1 < len(fields) else ""
    field_rows.append([left, right])
field_table = Table(field_rows, colWidths=[doc.width / 2] * 2)
field_table.setStyle(TableStyle([
    ("ROWBACKGROUNDS", (0, 0), (-1, -1), [WHITE, PALE_GREEN]),
    ("BOX", (0, 0), (-1, -1), 0.5, LINE),
    ("INNERGRID", (0, 0), (-1, -1), 0.35, LINE),
    ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ("LEFTPADDING", (0, 0), (-1, -1), 8),
    ("RIGHTPADDING", (0, 0), (-1, -1), 8),
    ("TOPPADDING", (0, 0), (-1, -1), 4),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
]))
story += [field_table, Spacer(1, 7), Paragraph("Ordem dos serviços por público", styles["CoverSection"])]
audience_counts = Counter(clean(record.get("Público")) or "Não informado" for record in records)
ordered_audiences = [item for item in AUDIENCE_SEQUENCE if audience_counts[item[0]]]
remaining_audiences = sorted(
    (audience for audience in audience_counts if audience not in AUDIENCE_PRIORITY),
    key=str.casefold,
)
index_rows = [[Paragraph("Ordem", styles["Section"]), Paragraph("Público", styles["Section"]), Paragraph("Qtd.", styles["Section"])]]
for position, (audience, label) in enumerate(ordered_audiences, 1):
    index_rows.append([
        Paragraph(str(position), styles["Index"]),
        Paragraph(escape(label), styles["Index"]),
        Paragraph(str(audience_counts[audience]), styles["Index"]),
    ])
for offset, audience in enumerate(remaining_audiences, len(ordered_audiences) + 1):
    index_rows.append([
        Paragraph(str(offset), styles["Index"]),
        Paragraph(escape(audience), styles["Index"]),
        Paragraph(str(audience_counts[audience]), styles["Index"]),
    ])
index = Table(index_rows, colWidths=[18 * mm, doc.width - 36 * mm, 18 * mm], repeatRows=1)
index.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, 0), GREEN),
    ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, PALE_GREEN]),
    ("LINEBELOW", (0, 0), (-1, -1), 0.35, LINE),
    ("ALIGN", (0, 0), (0, -1), "CENTER"),
    ("ALIGN", (2, 0), (2, -1), "CENTER"),
    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ("TOPPADDING", (0, 0), (-1, -1), 3),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
]))
story.append(index)


def section(title, content, pending=False):
    style = styles["Pending"] if pending else styles["Body"]
    return [Paragraph(escape(title), styles["Section"]), Paragraph(content, style), Spacer(1, 2)]


def bullet_steps(items):
    if not items:
        return "<font color='#A87400'>Etapas ainda não informadas.</font>"
    if len(items) == 1:
        return escape(items[0])
    return "<br/>".join(f"<b>{idx}.</b> {escape(item)}" for idx, item in enumerate(items, 1))


def bullet_items(items):
    return "<br/>".join(f"&#8226; {escape(item)}" for item in items)


def lines_html(items):
    return "<br/>".join(escape(item) for item in items)


def balance_service_columns(groups, column_width):
    def group_height(group):
        height = 0
        for flowable in group:
            _, wrapped_height = flowable.wrap(column_width, 1000 * mm)
            height += wrapped_height
            height += flowable.getSpaceBefore() + flowable.getSpaceAfter()
        return height

    heights = [group_height(group) for group in groups]
    best_split = min(
        range(1, len(groups)),
        key=lambda split: max(sum(heights[:split]), sum(heights[split:])),
    )
    left = [flowable for group in groups[:best_split] for flowable in group]
    right = [flowable for group in groups[best_split:] for flowable in group]
    return left, right


story.append(NextPageTemplate("services"))
story.append(PageBreak())

for record_index, record in enumerate(records):
    service_flow = []
    gaps = classify_gaps(record)
    title = clean(record.get("Serviço"))
    audience = clean(record.get("Público")) or "Não informado"
    category = clean(record.get("Categoria atual")) or "Não informada"
    org = clean(record.get("Órgão responsável")) or "Órgão não informado"

    enrichment = enrichments.get(title, {})
    service = record["_service"]
    page_created = bool(service.get("slug"))
    if page_created:
        title = clean(service["title"])
        contacts = [service["whereWhen"]] if service.get("whereWhen") else []
        for item in service.get("whereWhenItems", []):
            contacts.append(" - ".join(str(item.get(k) or "") for k in ("label", "schedule", "description") if item.get(k)))
        for channel in service.get("channels", []):
            if not channel.get("url"):
                contacts.append(channel["label"] + ": " + channel["value"])
        enrichment = {
            "about": service.get("summary") or "Página explicativa do serviço municipal e do canal responsável pelo atendimento.",
            "eligibility": service.get("eligibility") or "Os critérios de atendimento devem ser confirmados com o órgão responsável antes da publicação definitiva.",
            "documents": service.get("documents") or ["A relação oficial de documentos ainda será confirmada pelo órgão responsável."],
            "steps": service.get("steps") or ["Confira os critérios e documentos.", "Acesse o canal de solicitação indicado nesta página.", "Acompanhe a solicitação diretamente no sistema responsável."],
            "where_when": contacts,
            "cost": service.get("cost") or "O valor deste serviço ainda não foi definido.",
            "duration": service.get("duration") or "O prazo estimado deste serviço ainda não foi definido.",
            "sources": [{"label":c["label"] + ": " + c["value"], "url":c["url"]} for c in service.get("channels", []) if c.get("url")],
            "legislation": [], "legislation_links": [],
        }

    onedoc_search_url, maisdigital_search_url = service_search_links(title)
    enriched_eligibility = clean(enrichment.get("eligibility"))
    if enriched_eligibility:
        eligibility, eligibility_known = escape(enriched_eligibility), True
    else:
        eligibility, eligibility_known = eligibility_text(record, gaps["eligibility"])

    if page_created:
        service_flow.append(Paragraph("<font color='#087449'><b>Página criada na Central</b></font>", styles["HeroAudience"]))
    if eligibility_known and audience != "Não informado":
        service_flow.append(Paragraph(escape(audience.upper()), styles["HeroAudience"]))
    service_flow.append(Paragraph(escape(title), styles["HeroTitle"]))
    service_flow.append(Paragraph(
        f"<b>Categoria:</b> {escape(category)} &nbsp;&nbsp; <b>Órgão responsável:</b> {escape(org)}",
        styles["Meta"],
    ))
    service_flow.append(Spacer(1, 7))

    content_groups = []
    enriched_about = clean(enrichment.get("about"))
    if enriched_about:
        content_groups.append(section("O que é", escape(enriched_about)))
    else:
        content_groups.append(section("O que é", escape(pending_text(gaps["about"], "Definição oficial do serviço ainda não informada.")), pending=True))
    content_groups.append(section(
        "Quem pode solicitar",
        eligibility,
        pending=not eligibility_known,
    ))
    enriched_documents = enrichment.get("documents") or []
    if enriched_documents:
        content_groups.append(section("Documentos necessários", bullet_items(enriched_documents)))
    else:
        content_groups.append(section("Documentos necessários", escape(pending_text(gaps["documents"], "Nenhum documento necessário foi confirmado na base atual.")), pending=True))

    # Lacunas internas não são etapas confirmadas do procedimento.
    # Só numeramos etapas quando houver conteúdo específico validado na base.
    step_lines = enrichment.get("steps") or split_items(record.get("Como solicitar - etapas"))
    content_groups.append(section("Como solicitar - etapas", bullet_steps(step_lines), pending=not bool(step_lines)))

    enriched_where = enrichment.get("where_when") or []
    if enriched_where:
        content_groups.append(section(
            "Onde e quando solicitar",
            lines_html(enriched_where)
            + ("" if page_created else "<br/><font color='#A87400'>Horários de atendimento não informados na ficha do BA.GOV.BR.</font>"),
        ))
    elif not page_created:
        content_groups.append(section(
            "Onde e quando solicitar",
            "<font color='#A87400'>"
            + escape(pending_text(gaps["where"], "Local, horário e unidade de atendimento ainda não informados."))
            + "</font>",
            pending=True,
        ))

    enriched_cost = clean(enrichment.get("cost"))
    if enriched_cost:
        content_groups.append(section("Custo", escape(enriched_cost), pending=enriched_cost.casefold().startswith("a confirmar")))
    else:
        content_groups.append(section("Custo", escape(pending_text(gaps["cost"], "Custo ou gratuidade ainda não informados.")), pending=True))
    enriched_duration = clean(enrichment.get("duration"))
    if enriched_duration:
        content_groups.append(section("Prazo estimado", escape(enriched_duration)))
    else:
        content_groups.append(section("Prazo estimado", escape(pending_text(gaps["duration"], "Prazo de atendimento ainda não informado.")), pending=True))

    channel_flow = [Paragraph("Links referentes", styles["Section"])]
    if page_created:
        channel_flow.append(search_link("Central", "Abrir página do serviço", "https://maisdigital.amargosa.ba.gov.br/servicos/" + service["slug"], styles["Link"]))
        channel_flow.append(search_link("Solicitação", service.get("destination") or "Canal de atendimento", service["url"], styles["Link"]))
        if service.get("notice"):
            channel_flow.append(Paragraph(escape(service["notice"]), styles["Body"]))
        if service.get("noticeAction"):
            channel_flow.append(Paragraph(escape(service["noticeAction"]), styles["Body"]))
        for related_id in service.get("relatedServiceIds", []):
            related = by_id.get(related_id)
            if related:
                related_url = ("https://maisdigital.amargosa.ba.gov.br/servicos/" + related["slug"]) if related.get("slug") else related["url"]
                channel_flow.append(search_link("Relacionado", related["title"], related_url, styles["Link"]))
    else:
        channel_flow.append(search_link("1Doc", f'Pesquisar "{title}"', onedoc_search_url, styles["Link"]))
        channel_flow.append(search_link("Central", f'Pesquisar "{title}"', maisdigital_search_url, styles["Link"]))
    for source in enrichment.get("sources") or []:
        source_label = clean(source.get("label")) or "Serviço correspondente"
        source_url = clean(source.get("url"))
        if source_url:
            channel_flow.append(search_link(
                "Referência",
                source_label,
                source_url,
                styles["Link"],
            ))
    channel_flow.append(Spacer(1, 4))
    content_groups.append(channel_flow)

    legislation_urls = [] if page_created else urls(record.get("Legislação / fonte federal-estadual"))
    legislation_flow = [Paragraph("Legislação relacionada", styles["Section"])]
    if page_created:
        for law in service.get("legislation", []):
            legislation_flow.append(search_link("Norma", law["label"], law["url"], styles["Link"]))
    for url in legislation_urls:
        legislation_flow.append(domain_link("Fonte normativa identificada", url, styles["Link"]))
    enriched_legislation = enrichment.get("legislation") or []
    for url in enrichment.get("legislation_links") or []:
        legislation_flow.append(domain_link("Fonte indicada no BA.GOV.BR", url, styles["Link"]))
    if enriched_legislation:
        legislation_flow.append(Paragraph(lines_html(enriched_legislation), styles["Body"]))
    elif not page_created and gaps["legislation"]:
        legislation_flow.append(Paragraph(escape(pending_text(gaps["legislation"], "")), styles["Pending"]))
    elif not legislation_urls and not (page_created and service.get("legislation")):
        legislation_flow.append(Paragraph("Base normativa ainda não informada.", styles["Pending"]))
    legislation_flow.append(Spacer(1, 4))
    content_groups.append(legislation_flow)

    left, right = balance_service_columns(
        content_groups,
        SERVICE_FRAME_INNER_WIDTH * 0.5 - 12,
    )

    columns = Table(
        [[left, right]],
        colWidths=[SERVICE_FRAME_INNER_WIDTH * 0.5] * 2,
        hAlign="CENTER",
    )
    columns.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("BACKGROUND", (0, 0), (-1, -1), WHITE),
        ("LINEAFTER", (0, 0), (0, 0), 0.6, LINE),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    service_flow.append(columns)

    fitted_service = KeepInFrame(
        SERVICE_FRAME_INNER_WIDTH,
        SERVICE_FRAME_INNER_HEIGHT,
        service_flow,
        mode="shrink",
        vAlign="TOP",
        mergeSpace=True,
    )
    story.append(fitted_service)

    is_last = record_index == len(records) - 1
    if not is_last:
        story.append(FrameBreak())

doc.build(story)
print(str(OUTPUT))
print(f"SERVICES={len(records)} CREATED={created_count}")
