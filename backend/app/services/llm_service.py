import logging
import asyncio
import httpx
from typing import List, Dict, Any, Optional
from backend.app.config import settings

logger = logging.getLogger(__name__)

class LLMService:
    def __init__(self):
        self.api_key = settings.OPENROUTER_API_KEY
        self.model = settings.OPENROUTER_MODEL
        self.base_url = settings.OPENROUTER_BASE_URL.rstrip("/")
        self.timeout = 45.0
        self.max_retries = 3

    async def generate_response(
        self,
        system_prompt: str,
        user_message: str,
        conversation_history: Optional[List[Dict[str, str]]] = None,
        temperature: float = 0.2,
        max_tokens: int = 1000
    ) -> str:
        """
        Calls OpenRouter's OpenAI-compatible chat completions endpoint with async retry and exponential backoff.
        """
        if not self.api_key:
            logger.warning("OPENROUTER_API_KEY is not set.")
            return (
                "OpenRouter API key is not configured. Please set the OPENROUTER_API_KEY environment variable "
                "to enable live AI responses. The retrieved context and source citations below have been gathered "
                "from the real estate database."
            )

        messages = [{"role": "system", "content": system_prompt}]
        if conversation_history:
            messages.extend(conversation_history)
        messages.append({"role": "user", "content": user_message})

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://propintel.ai",
            "X-Title": "PropIntel AI Real Estate Assistant"
        }

        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens
        }

        endpoint = f"{self.base_url}/chat/completions"

        for attempt in range(1, self.max_retries + 1):
            try:
                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    response = await client.post(endpoint, headers=headers, json=payload)
                    
                    if response.status_code == 200:
                        data = response.json()
                        choices = data.get("choices", [])
                        if choices and "message" in choices[0]:
                            return choices[0]["message"].get("content", "").strip()
                        return "Received empty response from OpenRouter."

                    elif response.status_code == 429:
                        # Rate limited
                        logger.warning(f"OpenRouter rate limit (429) on attempt {attempt}. Retrying...")
                        if attempt == self.max_retries:
                            return (
                                "The AI service is currently rate limited by OpenRouter. "
                                "Please wait a moment and try again. Retrieved sources remain listed below."
                            )
                        await asyncio.sleep(2 ** attempt)

                    elif response.status_code in (500, 502, 503, 504):
                        logger.warning(f"OpenRouter server error ({response.status_code}) on attempt {attempt}. Retrying...")
                        if attempt == self.max_retries:
                            return (
                                "OpenRouter model service is temporarily unavailable. "
                                "Please try again shortly. Verified sources have been retrieved below."
                            )
                        await asyncio.sleep(2 ** attempt)

                    else:
                        error_detail = response.text
                        logger.error(f"OpenRouter API error {response.status_code}: {error_detail}")
                        return (
                            f"OpenRouter error ({response.status_code}): Unable to generate completion at this time. "
                            "Verified source citations are displayed below."
                        )

            except httpx.TimeoutException:
                logger.warning(f"OpenRouter request timed out on attempt {attempt}")
                if attempt == self.max_retries:
                    return (
                        "OpenRouter request timed out. The model took too long to respond. "
                        "Please verify your connection and try again."
                    )
                await asyncio.sleep(1.5 ** attempt)

            except Exception as e:
                logger.error(f"Unexpected error calling OpenRouter: {e}")
                if attempt == self.max_retries:
                    return f"Service unavailable: Failed to connect to OpenRouter ({str(e)})."
                await asyncio.sleep(1.5)

        return "Service unavailable: Failed to generate response from OpenRouter after multiple attempts."

llm_service = LLMService()
