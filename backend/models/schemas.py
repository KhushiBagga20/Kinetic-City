from pydantic import BaseModel
from typing import Optional


class ConversationMessage(BaseModel):
    role: str
    content: str


class MentorRequest(BaseModel):
    message: str
    fear_type: str
    metaphor_style: str
    context: str = "arjun_chat_page"
    conversation_history: list[ConversationMessage] = []


class MentorResponse(BaseModel):
    reply: str


class UserRequest(BaseModel):
    name: str
    email: str
    fear_type: str
    metaphor_style: str
    guest_id: Optional[str] = None
    password: Optional[str] = None


class UserResponse(BaseModel):
    success: bool
    user_id: str


class SignInRequest(BaseModel):
    email: str
    password: str


class SignInResponse(BaseModel):
    success: bool
    user_id: str
    name: str
    fear_type: Optional[str] = None


class SandboxDebriefRequest(BaseModel):
    year: str
    allocation: dict  # { nifty, midcap, smallcap, debt }
    final_values: dict  # { nifty, midcap, smallcap, debt }
    did_pull_out: bool
    pulled_out_month: Optional[int] = None
    fear_type: str


class SandboxDebriefResponse(BaseModel):
    debrief: str


class InstinctDebriefRequest(BaseModel):
    start_year: int
    monthly_amount: float
    did_withdraw: bool
    withdraw_month: Optional[int] = None
    fear_type: str
    final_value: float
    total_invested: float


class InstinctDebriefResponse(BaseModel):
    debrief: str


class SandboxAdviceRequest(BaseModel):
    year: str
    user_allocation: dict
    optimal_allocation: dict
    user_result: float
    optimal_result: float
    total_invested: float
    fear_type: str
    did_pull_out: bool


class SandboxAdviceResponse(BaseModel):
    advice: str


class HarvestDebriefRequest(BaseModel):
    era: str
    era_years: int
    budget: float
    style: str
    allocation: dict
    final_value: float
    total_invested: float
    fear_type: str


class HarvestDebriefResponse(BaseModel):
    insights: str


class FearQuoteRequest(BaseModel):
    fear_type: str
    user_name: str = ''
    context: str = 'dashboard'  # dashboard, profile, card, simulation, portfolio


class FearQuoteResponse(BaseModel):
    quote: str
