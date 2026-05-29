import pytesseract
from PIL import Image
import asyncio
from typing import List, Tuple


async def ocr_single_image(image_path: str, page_index: int) -> Tuple[int, str]:
    """
    Run Tesseract OCR on a single image file.

    Returns:
        (page_index, extracted_text)
    """
    loop = asyncio.get_event_loop()

    def _run_ocr():
        img = Image.open(image_path)
        # Use LSTM engine with best quality config
        custom_config = r"--oem 3 --psm 6"
        text = pytesseract.image_to_string(img, config=custom_config)
        img.close()
        return text

    text = await loop.run_in_executor(None, _run_ocr)
    return page_index, text


async def extract_text_from_images(image_paths: List[str]) -> Tuple[str, int]:
    """
    Run OCR on all images in parallel and combine results.

    Returns:
        (combined_raw_text, page_count)
    """
    if not image_paths:
        return "", 0

    # Process all pages concurrently
    tasks = [ocr_single_image(path, idx) for idx, path in enumerate(image_paths)]
    results = await asyncio.gather(*tasks)

    # Sort by page index and combine
    results_sorted = sorted(results, key=lambda x: x[0])

    page_texts = []
    for page_idx, text in results_sorted:
        page_header = f"\n{'='*60}\n  PAGE {page_idx + 1}\n{'='*60}\n"
        page_texts.append(page_header + text.strip())

    raw_text = "\n\n".join(page_texts)
    return raw_text, len(image_paths)
