import sys
import json
import os

try:
    import fitz  # PyMuPDF
except ImportError:
    print(json.dumps({"error": "PyMuPDF not installed. Run: pip install PyMuPDF"}))
    sys.exit(1)


def convert_pdf_to_images(pdf_path, output_dir, dpi=300):
    """
    Convert each page of a PDF into a PNG image.
    Also extract the LEFT HALF of each page (the illustration).
    """

    # Create output directories
    pages_dir = os.path.join(output_dir, "pages")
    illustrations_dir = os.path.join(output_dir, "illustrations")
    os.makedirs(pages_dir, exist_ok=True)
    os.makedirs(illustrations_dir, exist_ok=True)

    # Open the PDF
    doc = fitz.open(pdf_path)
    total_pages = len(doc)

    pages = []
    illustrations = []

    page_width = 0
    page_height = 0
    illustration_width = 0

    for i in range(total_pages):
        page = doc[i]
        page_number = i + 1

        # Calculate zoom for desired DPI
        zoom = dpi / 72.0
        matrix = fitz.Matrix(zoom, zoom)

        # ── Render the FULL page at high DPI ──
        pix = page.get_pixmap(matrix=matrix)
        page_width = pix.width
        page_height = pix.height

        # Save full page image
        full_page_path = os.path.join(pages_dir, "page-" + str(page_number) + ".png")
        pix.save(full_page_path)
        pages.append(full_page_path)

        # ── Render ONLY the LEFT HALF (illustration) ──
        # Instead of cropping the pixmap (which has version issues),
        # we render only the left half of the page using a clip rectangle
        page_rect = page.rect
        left_half_rect = fitz.Rect(
            page_rect.x0,
            page_rect.y0,
            page_rect.x0 + (page_rect.width / 2),
            page_rect.y1
        )

        # Render only the clipped region
        left_pix = page.get_pixmap(matrix=matrix, clip=left_half_rect)
        illustration_width = left_pix.width

        # Save illustration
        illustration_path = os.path.join(
            illustrations_dir,
            "illustration-" + str(page_number) + ".png"
        )
        left_pix.save(illustration_path)
        illustrations.append(illustration_path)

        # Print progress
        print(
            "Page " + str(page_number) + "/" + str(total_pages) + " extracted",
            file=sys.stderr
        )

    doc.close()

    # Return results as JSON
    result = {
        "success": True,
        "totalPages": total_pages,
        "pages": pages,
        "illustrations": illustrations,
        "pageWidth": page_width,
        "pageHeight": page_height,
        "illustrationWidth": illustration_width,
        "dpi": dpi
    }

    return result


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(json.dumps({
            "error": "Usage: python pdf_to_images.py <pdf_path> <output_dir>"
        }))
        sys.exit(1)

    pdf_path = sys.argv[1]
    output_dir = sys.argv[2]

    if not os.path.exists(pdf_path):
        print(json.dumps({"error": "PDF file not found: " + pdf_path}))
        sys.exit(1)

    result = convert_pdf_to_images(pdf_path, output_dir)
    print(json.dumps(result))