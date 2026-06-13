from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import ChatHistory
from ..schemas import ChatRequest, ChatResponse
from ..services.ai_service import chat_with_ai

router = APIRouter(prefix="/api", tags=["chat"])


@router.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest, db: Session = Depends(get_db)):
    reply = await chat_with_ai(
        message=req.message,
        agent_type=req.agent_type,
        lesson_id=req.lesson_id,
        history=req.history
    )

    return ChatResponse(reply=reply)
