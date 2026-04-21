"""
Azure OpenAI Pool — Routes all backend AI calls through Azure OpenAI (GPT-4o).

Usage:
    from lib.groq_pool import get_chat_model, generate, is_configured

    # Simple one-shot
    text = generate("Explain SIP", area="mentor", system_instruction="You are KINU...")

    # Or get a chat session
    chat = get_chat_model(area="mentor", system_instruction="...")
    response = chat.send_message("Hello")
"""
import os
import logging
import httpx
from typing import Optional

logger = logging.getLogger("ai_pool")


# ── Lazy-loaded config (env vars aren't available at import time) ─────────────

def _get_api_key() -> str:
    return os.getenv("AZURE_OPENAI_API_KEY", "")

def _get_endpoint() -> str:
    return os.getenv("AZURE_OPENAI_ENDPOINT", "")


def generate(
    prompt: str,
    area: str = "mentor",
    system_instruction: Optional[str] = None,
    model_name: str = "gpt-4o",
    max_output_tokens: Optional[int] = None,
) -> str:
    """Generate content via Azure OpenAI GPT-4o."""
    api_key = _get_api_key()
    endpoint = _get_endpoint()

    if not api_key or not endpoint:
        raise ValueError(
            "Azure OpenAI not configured. "
            "Set AZURE_OPENAI_API_KEY and AZURE_OPENAI_ENDPOINT in .env"
        )

    messages = []
    if system_instruction:
        messages.append({"role": "system", "content": system_instruction})
    messages.append({"role": "user", "content": prompt})

    payload = {"messages": messages}
    if max_output_tokens:
        payload["max_completion_tokens"] = max_output_tokens

    with httpx.Client(timeout=60.0) as client:
        res = client.post(
            endpoint,
            headers={
                "api-key": api_key,
                "Content-Type": "application/json",
            },
            json=payload,
        )

        if res.status_code == 429:
            logger.warning(f"[AzureAI] Rate limited (area: {area}).")

        res.raise_for_status()
        data = res.json()
        text = data.get("choices", [{}])[0].get("message", {}).get("content", "")
        if not text:
            raise ValueError("Empty response from Azure OpenAI")
        return text.strip()


class AzureChatSession:
    """Maintains multi-turn conversation state for Azure OpenAI."""

    def __init__(self, system_instruction: Optional[str] = None, history: list = None):
        self.system_instruction = system_instruction
        self.history = history or []

    def send_message(self, message: str):
        api_key = _get_api_key()
        endpoint = _get_endpoint()

        messages = []
        if self.system_instruction:
            messages.append({"role": "system", "content": self.system_instruction})

        # Convert history to OpenAI format
        for msg in self.history:
            role = "assistant" if msg.get("role") == "model" else "user"
            content = msg.get("parts", [""])[0]
            messages.append({"role": role, "content": content})

        messages.append({"role": "user", "content": message})

        with httpx.Client(timeout=60.0) as client:
            res = client.post(
                endpoint,
                headers={
                    "api-key": api_key,
                    "Content-Type": "application/json",
                },
                json={"messages": messages},
            )
            res.raise_for_status()
            data = res.json()
            text = data.get("choices", [{}])[0].get("message", {}).get("content", "")

            # Update history
            self.history.append({"role": "user", "parts": [message]})
            self.history.append({"role": "model", "parts": [text]})

            class ResponseMock:
                def __init__(self, t):
                    self.text = t

            return ResponseMock(text)


def get_chat_model(
    area: str = "mentor",
    system_instruction: Optional[str] = None,
    model_name: str = "gpt-4o",
    history: list = None,
) -> AzureChatSession:
    """Return a chat session backed by Azure OpenAI."""
    if not is_configured():
        raise ValueError(
            "Azure OpenAI not configured. "
            "Set AZURE_OPENAI_API_KEY and AZURE_OPENAI_ENDPOINT in .env"
        )
    return AzureChatSession(system_instruction, history)


def is_configured() -> bool:
    return bool(_get_api_key() and _get_endpoint())


def key_count() -> int:
    return 1 if is_configured() else 0
