import re

import pymupdf

from ..utils.errors import AppError


def extract_chunks(path):
    chunks = []
    try:
        with pymupdf.open(path) as pdf:
            if pdf.needs_pass:
                raise AppError('This PDF is password protected. Upload an unlocked copy.', 422)
            if len(pdf) > 500:
                raise AppError('This PDF exceeds the 500-page limit. Split it into smaller documents.', 413)
            count = len(pdf)
            empty = 0
            for number, page in enumerate(pdf, 1):
                text = page.get_text(sort=True).replace('\x00', '')
                text = re.sub(r'[^\S\n]+', ' ', text)
                text = re.sub(r'\n{3,}', '\n\n', text).strip()
                if len(text) < 20:
                    empty += 1
                    continue
                start = 0
                while start < len(text):
                    end = min(start + 1400, len(text))
                    if end < len(text):
                        boundary = max(text.rfind('\n', start + 800, end), text.rfind('. ', start + 800, end))
                        if boundary > start:
                            end = boundary + 1
                    chunks.append({'page': number, 'position': len(chunks), 'text': text[start:end].strip()})
                    if end == len(text):
                        break
                    start = end - 200
                    if len(chunks) > 2000:
                        raise AppError('This PDF contains too much text. Split it into smaller documents.', 413)
            if not chunks:
                raise AppError('No readable text found. Scanned or image-only PDFs need OCR first; upload a PDF with selectable text.', 422)
            # Do not silently index a partially scanned document as complete.
            if empty > max(2, count // 3):
                raise AppError('Many pages have no readable text. Run OCR on this PDF before uploading so its content is not missed.', 422)
            return count, chunks
    except AppError:
        raise
    except Exception:
        raise AppError('This file is not a readable PDF, or it is corrupted.', 422) from None
