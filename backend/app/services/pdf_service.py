from reportlab.lib.pagesizes import A4, landscape
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
from reportlab.lib.colors import HexColor, white, Color
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from PIL import Image
import os
import uuid
import textwrap
import io


# ── PAGE SETUP ──────────────────────────────────────────────────────────────
PAGE_W, PAGE_H = landscape(A4)   # 841.9 x 595.3 pt
SPINE_W = 4                       # thin book-spine strip

# Left (image) panel
LEFT_W = PAGE_W * 0.42
LEFT_BG = HexColor("#12102a")

# Right (text) panel
RIGHT_START = LEFT_W + SPINE_W
RIGHT_W = PAGE_W - LEFT_W - SPINE_W
RIGHT_BG = HexColor("#fffef9")

# Accent / decoration colours
ACCENT_GOLD = HexColor("#f59e0b")
SPINE_DARK = HexColor("#0d0b1e")
TEXT_COLOR = HexColor("#374151")
PAGE_NUM_COLOR = HexColor("#9ca3af")
QUOTE_COLOR = HexColor("#e5e7eb")


def _draw_rounded_rect(c, x, y, w, h, r, fill_color, stroke_color=None):
    """Draw a filled rounded rectangle (approximated with clipping path)."""
    c.saveState()
    c.setFillColor(fill_color)
    if stroke_color:
        c.setStrokeColor(stroke_color)
    else:
        c.setStrokeColor(fill_color)
    c.roundRect(x, y, w, h, r, fill=1, stroke=0)
    c.restoreState()


def _draw_corner_brackets(c, x, y, w, h, size=14, lw=1.2):
    """Draw four golden corner L-brackets inside a rectangle."""
    c.saveState()
    c.setStrokeColor(ACCENT_GOLD)
    c.setLineWidth(lw)
    pad = 10
    # top-left
    c.line(x + pad,         y + h - pad,         x + pad + size,  y + h - pad)
    c.line(x + pad,         y + h - pad,         x + pad,         y + h - pad - size)
    # top-right
    c.line(x + w - pad,     y + h - pad,         x + w - pad - size, y + h - pad)
    c.line(x + w - pad,     y + h - pad,         x + w - pad,     y + h - pad - size)
    # bottom-left
    c.line(x + pad,         y + pad,             x + pad + size,  y + pad)
    c.line(x + pad,         y + pad,             x + pad,         y + pad + size)
    # bottom-right
    c.line(x + w - pad,     y + pad,             x + w - pad - size, y + pad)
    c.line(x + w - pad,     y + pad,             x + w - pad,     y + pad + size)
    c.restoreState()


def _draw_image_panel(c, image_path, page_number, total_pages):
    """Draw the left dark panel with the portrait image centred in 9:16 ratio."""
    # Background
    c.saveState()
    c.setFillColor(LEFT_BG)
    c.rect(0, 0, LEFT_W, PAGE_H, fill=1, stroke=0)
    c.restoreState()

    # --- image ---
    img_padding = 20
    max_img_w = LEFT_W - img_padding * 2

    # Keep 9:16 portrait ratio
    img_h = min(PAGE_H - img_padding * 2, max_img_w * 16 / 9)
    img_w = img_h * 9 / 16

    img_x = (LEFT_W - img_w) / 2
    img_y = (PAGE_H - img_h) / 2

    if image_path and os.path.exists(image_path):
        try:
            img_reader = ImageReader(image_path)
            # Rounded clip mask (approximate with a path)
            c.saveState()
            p = c.beginPath()
            r = 12  # corner radius
            p.moveTo(img_x + r, img_y)
            p.lineTo(img_x + img_w - r, img_y)
            p.arcTo(img_x + img_w - r * 2, img_y, img_x + img_w, img_y + r * 2, -90, 90)
            p.lineTo(img_x + img_w, img_y + img_h - r)
            p.arcTo(img_x + img_w - r * 2, img_y + img_h - r * 2, img_x + img_w, img_y + img_h, 0, 90)
            p.lineTo(img_x + r, img_y + img_h)
            p.arcTo(img_x, img_y + img_h - r * 2, img_x + r * 2, img_y + img_h, 90, 90)
            p.lineTo(img_x, img_y + r)
            p.arcTo(img_x, img_y, img_x + r * 2, img_y + r * 2, 180, 90)
            p.close()
            c.clipPath(p, stroke=0)
            c.drawImage(img_reader, img_x, img_y, width=img_w, height=img_h,
                        preserveAspectRatio=True, anchor='c')
            c.restoreState()
        except Exception as e:
            print(f"[PDFService] Image draw error: {e}")
            # Placeholder box
            c.saveState()
            c.setFillColor(HexColor("#1e1b4b"))
            c.roundRect(img_x, img_y, img_w, img_h, 12, fill=1, stroke=0)
            c.restoreState()
    else:
        # Placeholder
        c.saveState()
        c.setFillColor(HexColor("#1e1b4b"))
        c.roundRect(img_x, img_y, img_w, img_h, 12, fill=1, stroke=0)
        c.restoreState()

    # Corner brackets over image
    _draw_corner_brackets(c, img_x, img_y, img_w, img_h)

    # Page counter badge (bottom-centre of left panel)
    badge_text = f"{page_number} / {total_pages}"
    badge_w = 60
    badge_h = 18
    badge_x = (LEFT_W - badge_w) / 2
    badge_y = img_y - 28
    if badge_y > 8:
        c.saveState()
        c.setFillColor(HexColor("#00000099"))
        c.roundRect(badge_x, badge_y, badge_w, badge_h, 9, fill=1, stroke=0)
        c.setFillColor(HexColor("#ffffff99"))
        c.setFont("Helvetica-Bold", 7)
        c.drawCentredString(LEFT_W / 2, badge_y + 5, badge_text)
        c.restoreState()


def _wrap_text(text, font_name, font_size, max_width, c_obj):
    """Wrap text to fit max_width, returns list of lines."""
    words = text.split()
    lines = []
    current = ""
    for word in words:
        trial = f"{current} {word}".strip()
        if c_obj.stringWidth(trial, font_name, font_size) <= max_width:
            current = trial
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines


def _draw_text_panel(c, text, page_number, total_pages, template_title=""):
    """Draw the right warm paper panel with styled story text."""
    rx = RIGHT_START
    rw = RIGHT_W

    # Warm paper background
    c.saveState()
    c.setFillColor(RIGHT_BG)
    c.rect(rx, 0, rw, PAGE_H, fill=1, stroke=0)
    c.restoreState()

    # Subtle dot texture (drawn as tiny circles)
    c.saveState()
    c.setFillColor(HexColor("#f0ece4"))
    dot_spacing = 18
    for xi in range(int(rw // dot_spacing) + 1):
        for yi in range(int(PAGE_H // dot_spacing) + 1):
            c.circle(rx + xi * dot_spacing, yi * dot_spacing, 0.8, fill=1, stroke=0)
    c.restoreState()

    # Spine shadow stripe
    c.saveState()
    c.setFillColor(SPINE_DARK)
    c.rect(LEFT_W, 0, SPINE_W, PAGE_H, fill=1, stroke=0)
    c.restoreState()

    # ── Decorative large quote mark ──
    c.saveState()
    c.setFillColor(QUOTE_COLOR)
    c.setFont("Times-Roman", 72)
    c.drawString(rx + 28, PAGE_H - 60, "\u201c")  # left double quote
    c.restoreState()

    # ── Story text ──
    text_x = rx + 36
    text_w = rw - 72
    font_name = "Times-Roman"
    font_size = 13
    line_height = font_size * 1.85

    lines = _wrap_text(text or "End of story. ✨", font_name, font_size, text_w, c)

    # Vertically centre the text block
    block_h = len(lines) * line_height
    text_start_y = (PAGE_H / 2) + (block_h / 2) - line_height * 0.5

    # Clamp so it doesn't overflow top (quote area) or bottom bar
    text_start_y = min(text_start_y, PAGE_H - 80)

    c.saveState()
    c.setFillColor(TEXT_COLOR)
    c.setFont(font_name, font_size)
    for i, line in enumerate(lines):
        y = text_start_y - i * line_height
        if y < 40:
            break
        # Centre each line
        line_w = c.stringWidth(line, font_name, font_size)
        c.drawString(rx + (rw - line_w) / 2, y, line)
    c.restoreState()

    # ── Bottom bar ──
    bar_h = 32
    c.saveState()
    c.setFillColor(HexColor("#f5f0e8"))
    c.rect(rx, 0, rw, bar_h, fill=1, stroke=0)

    # Divider line
    c.setStrokeColor(HexColor("#e5e7eb"))
    c.setLineWidth(0.5)
    c.line(rx + 20, bar_h, rx + rw - 20, bar_h)

    # Page number (right-aligned)
    c.setFillColor(PAGE_NUM_COLOR)
    c.setFont("Helvetica-Bold", 8)
    c.drawRightString(rx + rw - 20, 10, f"✦  {page_number}")

    # Book title (left-aligned, faint)
    if template_title:
        c.setFillColor(HexColor("#d1d5db"))
        c.setFont("Helvetica", 7)
        c.drawString(rx + 20, 10, template_title.upper())

    c.restoreState()


# ────────────────────────────────────────────────────────────────────────────

def generate_pdf(order):
    """
    Generates a premium children's book PDF.
    Layout: Landscape A4 two-page spread
      • Left  half: dark panel with 9:16 portrait illustration
      • Right half: warm paper panel with centred serif story text
    """
    os.makedirs("generated_pdfs", exist_ok=True)

    unique_name = f"{uuid.uuid4()}.pdf"
    local_path = os.path.join("generated_pdfs", unique_name)

    c = canvas.Canvas(local_path, pagesize=landscape(A4))

    pages_data = order.get("generated_pages", [])
    story_pages = order.get("story", {}).get("pages", [])
    template_title = order.get("story", {}).get("title", "")
    total_pages = len(pages_data)

    for idx, page in enumerate(pages_data):
        page_number = page.get("page_number", idx + 1)
        image_url = page.get("image_url", "")
        local_image_path = image_url.lstrip("/") if image_url else ""

        # Fallback text from story pages
        story_text = page.get("text", "")
        if not story_text and page_number - 1 < len(story_pages):
            story_text = story_pages[page_number - 1].get("text", "")

        # Draw left image panel
        _draw_image_panel(c, local_image_path, page_number, total_pages)

        # Draw right text panel
        _draw_text_panel(c, story_text, page_number, total_pages, template_title)

        c.showPage()

    c.save()
    print(f"[PDFService] Premium PDF saved: {local_path}")
    return f"/generated_pdfs/{unique_name}"