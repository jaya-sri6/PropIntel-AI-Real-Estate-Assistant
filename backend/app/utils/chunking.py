import re
from typing import List

class TextChunker:
    @staticmethod
    def chunk_text(text: str, chunk_size: int = 350, chunk_overlap: int = 50) -> List[str]:
        """
        Chunks text into overlapping passages respecting sentence and paragraph boundaries.
        chunk_size and chunk_overlap measured in words.
        """
        if not text or not text.strip():
            return []
        
        # Split by paragraphs or double newlines first
        paragraphs = [p.strip() for p in text.split("\n") if p.strip()]
        if not paragraphs:
            return []

        words = []
        for p in paragraphs:
            p_words = p.split()
            words.extend(p_words)

        if len(words) <= chunk_size:
            return [" ".join(words)]

        chunks = []
        start = 0
        while start < len(words):
            end = min(start + chunk_size, len(words))
            chunk = " ".join(words[start:end])
            chunks.append(chunk)
            if end >= len(words):
                break
            start += (chunk_size - chunk_overlap)

        return chunks
