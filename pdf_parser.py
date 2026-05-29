import fitz  # PyMuPDF
import asyncio
import os
import tempfile
from typing import List, Tuple


async def render_page(page, page_index: int, tmp_dir: str) -> str:
    """Render a single PDF page to a PNG image asynchronously."""
    loop = asyncio.get_event_loop()

    def _render():
        # 2x zoom for better OCR quality
        mat = fitz.Matrix(2.0, 2.0)
        pix = page.get_pixmap(matrix=mat, alpha=False)
        img_path = os.path.join(tmp_dir, f"page_{page_index:04d}.png")
        pix.save(img_path)
        return img_path

    return await loop.run_in_executor(None, _render)


async def parse_pdf_to_images(file_path: str) -> Tuple[List[str], int]:
    """
    Open a PDF and render all pages to temporary PNG images.

    Returns:
        (list of image file paths, total page count)
    """
    tmp_dir = tempfile.mkdtemp(prefix="documind_")

    def _open_pdf():
        return fitz.open(file_path)

    loop = asyncio.get_event_loop()
    doc = await loop.run_in_executor(None, _open_pdf)

    page_count = len(doc)

    # Render all pages concurrently
    tasks = [render_page(doc[i], i, tmp_dir) for i in range(page_count)]
    image_paths = await asyncio.gather(*tasks)

    doc.close()
    return list(image_paths), page_count


async def parse_image_to_images(file_path: str) -> Tuple[List[str], int]:
    """
    For direct image uploads (PNG/JPG), return the image path as-is.

    Returns:
        ([image_path], 1)
    """
    return [file_path], 1


async def parse_document(file_path: str, content_type: str) -> Tuple[List[str], int]:
    """
    Route document parsing based on file type.

    Returns:
        (list of image file paths, total page count)
    """
    if content_type == "application/pdf" or file_path.lower().endswith(".pdf"):
        return await parse_pdf_to_images(file_path)
    else:
        return await parse_image_to_images(file_path)
