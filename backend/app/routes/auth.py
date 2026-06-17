from fastapi import APIRouter, HTTPException, Depends, Request
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User
from ..schemas import RegisterRequest, LoginRequest, UserResponse

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _calc_level(points):
    if points >= 2001: return "年级楷模"
    if points >= 1001: return "班级学霸"
    if points >= 601:  return "学习达人"
    if points >= 301:  return "积极分子"
    if points >= 101:  return "勤奋学子"
    return "新手学员"


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
            id=user.id, name=user.name,
            studentId=user.student_id,
            points=user.points, level=user.level
        ).model_dump()
    }


@router.post("/login", response_model=dict)
async def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.student_id == req.studentId).first()
    if not user:
        raise HTTPException(status_code=404, detail="该学号未注册，请先注册账号")
    return {
        "user": UserResponse(
            id=user.id, name=user.name,
            studentId=user.student_id,
            points=user.points, level=user.level
        ).model_dump()
    }


@router.get("/profile")
async def get_profile(request: Request, db: Session = Depends(get_db)):
    """获取当前用户完整信息（积分+等级）"""
    student_id = request.headers.get("X-Student-Id", "")
    if not student_id:
        return {"points": 0, "level": "新手学员", "name": ""}
    user = db.query(User).filter(User.student_id == student_id).first()
    if not user:
        return {"points": 0, "level": "新手学员", "name": ""}
    return {
        "id": user.id, "name": user.name,
        "studentId": user.student_id,
        "points": user.points or 0,
        "level": user.level or "新手学员"
    }


@router.post("/points")
async def add_points(request: Request, db: Session = Depends(get_db)):
    """给当前用户加积分"""
    student_id = request.headers.get("X-Student-Id", "")
    body = await request.json()
    amount = body.get("amount", 0)
    if not student_id or amount <= 0:
        return {"success": False}
    user = db.query(User).filter(User.student_id == student_id).first()
    if not user:
        return {"success": False}
    user.points = (user.points or 0) + amount
    user.level = _calc_level(user.points)
    db.commit()
    return {"success": True, "points": user.points, "level": user.level}
