from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User
from ..schemas import RegisterRequest, LoginRequest, UserResponse

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=dict)
async def register(req: RegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.student_id == req.studentId).first()
    if existing:
        return {
            "user": UserResponse(
                id=existing.id,
                name=existing.name,
                studentId=existing.student_id,
                points=existing.points,
                level=existing.level
            ).model_dump()
        }

    user = User(name=req.name, student_id=req.studentId)
    db.add(user)
    db.commit()
    db.refresh(user)

    return {
        "user": UserResponse(
            id=user.id,
            name=user.name,
            studentId=user.student_id,
            points=user.points,
            level=user.level
        ).model_dump()
    }


@router.post("/login", response_model=dict)
async def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.student_id == req.studentId).first()
    if not user:
        raise HTTPException(status_code=404, detail="该学号未注册，请先注册账号")

    return {
        "user": UserResponse(
            id=user.id,
            name=user.name,
            studentId=user.student_id,
            points=user.points,
            level=user.level
        ).model_dump()
    }
