from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import WrongAnswer
from ..schemas import WrongAnswerRequest

router = APIRouter(prefix="/api", tags=["progress"])


@router.get("/wrong-answers")
async def get_wrong_answers(db: Session = Depends(get_db)):
    answers = db.query(WrongAnswer).order_by(WrongAnswer.created_at.desc()).limit(100).all()
    return [{
        "id": a.id,
        "lessonId": a.lesson_id,
        "lessonTitle": a.lesson_title,
        "question": a.question,
        "userAnswer": a.user_answer,
        "correctAnswer": a.correct_answer,
        "type": a.question_type,
        "createdAt": a.created_at.isoformat() if a.created_at else None
    } for a in answers]


@router.post("/wrong-answers")
async def add_wrong_answer(req: WrongAnswerRequest, db: Session = Depends(get_db)):
    wa = WrongAnswer(
        lesson_id=req.lesson_id,
        lesson_title=req.lesson_title,
        question=req.question,
        user_answer=req.user_answer,
        correct_answer=req.correct_answer,
        question_type=req.question_type
    )
    db.add(wa)
    db.commit()
    return {"success": True, "id": wa.id}


@router.get("/progress")
async def get_progress(db: Session = Depends(get_db)):
    return {"progress": 65, "completed": 6, "total": 8}


@router.put("/progress/{lesson_id}")
async def update_progress(lesson_id: int, body: dict, db: Session = Depends(get_db)):
    return {"success": True, "progress": body.get("progress", 0)}
