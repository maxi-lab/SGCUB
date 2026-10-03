from io import BytesIO

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

from .models import EstadoComprobanteChoices, MedioDePagoChoices
from .services import receipt_detail

CLUB_NAME = "Club Universitario de Berisso"
BORDER = colors.HexColor("#c4c7c5")
HEADER_BACKGROUND = colors.HexColor("#eef1f4")


def format_amount(value):
    formatted = f"{abs(value):,.2f}".replace(",", "_").replace(".", ",").replace("_", ".")
    return f"{'-' if value < 0 else ''}$ {formatted}"


def format_receipt_number(receipt_type, number):
    return f"{receipt_type} {number:08d}"


def receipt_filename(receipt):
    return f"comprobante-{receipt_detail(receipt)['tipo']}-{receipt.numero:08d}.pdf"


def table(rows, column_widths, total_row=False):
    content = Table(rows, colWidths=column_widths, hAlign="LEFT")
    style = [
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("BACKGROUND", (0, 0), (-1, 0), HEADER_BACKGROUND),
        ("GRID", (0, 0), (-1, -1), 0.5, BORDER),
        ("ALIGN", (-1, 0), (-1, -1), "RIGHT"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]
    if total_row:
        style += [
            ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
            ("BACKGROUND", (0, -1), (-1, -1), HEADER_BACKGROUND),
        ]
    content.setStyle(TableStyle(style))
    return content


def render_receipt_pdf(receipt):
    detail = receipt_detail(receipt)
    styles = getSampleStyleSheet()
    title = ParagraphStyle("Titulo", parent=styles["Title"], alignment=0, spaceAfter=2)
    subtitle = ParagraphStyle("Subtitulo", parent=styles["Normal"], textColor=colors.HexColor("#5f6368"))
    section = ParagraphStyle("Seccion", parent=styles["Heading3"], spaceBefore=10, spaceAfter=4)
    cancelled = ParagraphStyle("Anulado", parent=styles["Heading2"], textColor=colors.HexColor("#b3261e"))

    socio = detail["socio"] or {}
    width = A4[0] - 40 * mm
    story = [
        Paragraph(CLUB_NAME, subtitle),
        Paragraph(f"RECIBO {detail['tipo']}", title),
        Paragraph("Documento no válido como factura", subtitle),
        Spacer(1, 6 * mm),
        table(
            [
                ["Comprobante N°", "Fecha de emisión"],
                [
                    format_receipt_number(detail["tipo"], detail["numero"]),
                    detail["fecha_emision"].strftime("%d/%m/%Y"),
                ],
            ],
            [width / 2, width / 2],
        ),
    ]

    if detail["estado"] == EstadoComprobanteChoices.ANULADO:
        replacement = receipt.reemplazado_por
        note = "ANULADO"
        if replacement is not None:
            note += f" - Reemplazado por el comprobante {format_receipt_number(detail['tipo'], replacement.numero)}"
        story += [Spacer(1, 4 * mm), Paragraph(note, cancelled)]

    story += [
        Paragraph("Socio", section),
        table(
            [
                ["Apellido y nombre", "DNI", "N° de socio"],
                [
                    f"{socio.get('apellido', '')}, {socio.get('nombre', '')}",
                    socio.get("dni", ""),
                    str(socio.get("numero_socio", "")),
                ],
            ],
            [width * 0.5, width * 0.25, width * 0.25],
        ),
        Paragraph("Períodos abonados", section),
        table(
            [["Período", "Monto aplicado"]]
            + [[period["periodo"], format_amount(period["monto_aplicado"])] for period in detail["periodos"]],
            [width * 0.6, width * 0.4],
        ),
        Paragraph("Desglose", section),
        table(
            [["Concepto", "Importe"]]
            + [[line["concepto_nombre"], format_amount(line["monto"])] for line in detail["desglose"]]
            + [["Total abonado", format_amount(detail["monto_total"])]],
            [width * 0.6, width * 0.4],
            total_row=True,
        ),
        Paragraph("Medios de pago", section),
        table(
            [["Medio", "Monto"]]
            + [
                [MedioDePagoChoices(method["medio_de_pago"]).label, format_amount(method["monto"])]
                for method in detail["medios"]
            ],
            [width * 0.6, width * 0.4],
        ),
        Spacer(1, 10 * mm),
        Paragraph("Recibo de uso interno. Asociación civil exenta.", subtitle),
    ]

    buffer = BytesIO()
    SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=20 * mm,
        rightMargin=20 * mm,
        topMargin=18 * mm,
        bottomMargin=18 * mm,
        title=f"Recibo {format_receipt_number(detail['tipo'], detail['numero'])}",
        author=CLUB_NAME,
        pageCompression=0,
    ).build(story)
    return buffer.getvalue()
