"""Replaces page 1 of a PDF with one page of another PDF, keeping the bookmarks and links.
Usage: python3 scripts/put-cover-on-pdf.py <body.pdf> <covers.pdf> <cover-page-number> <out.pdf> "<title>"
Needs pypdf (pip install pypdf)."""
import sys
from pypdf import PdfReader, PdfWriter

body, covers, number, out, title = sys.argv[1], sys.argv[2], int(sys.argv[3]), sys.argv[4], sys.argv[5]
writer = PdfWriter(clone_from=body)
cover = PdfReader(covers).pages[number - 1]
writer.remove_page(0)
writer.insert_page(cover, 0)
writer.add_metadata({'/Title': title, '/Author': 'STEM Racing at The British School, New Delhi'})
writer.compress_identical_objects()
with open(out, 'wb') as file:
    writer.write(file)
