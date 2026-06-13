from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from ..database import get_db
from ..models import ForumPost, ForumReply
from ..schemas import ForumPostRequest, ForumReplyRequest
from datetime import datetime, timezone

router = APIRouter(prefix="/api/forum", tags=["forum"])


def _format_time(dt):
    if dt is None:
        return "刚刚"
    now = datetime.now(timezone.utc)
    diff = now - dt.replace(tzinfo=timezone.utc) if dt.tzinfo is None else now - dt
    seconds = int(diff.total_seconds())
    if seconds < 60:
        return "刚刚"
    if seconds < 3600:
        return f"{seconds // 60}分钟前"
    if seconds < 86400:
        return f"{seconds // 3600}小时前"
    return f"{seconds // 86400}天前"


@router.get("")
async def get_posts(db: Session = Depends(get_db)):
    posts = db.query(ForumPost).order_by(desc(ForumPost.created_at)).limit(50).all()
    return {
        "posts": [{
            "id": p.id,
            "avatar": p.author[0] if p.author else "?",
            "author": p.author,
            "time": _format_time(p.created_at),
            "content": p.content,
            "likes": p.likes,
            "replies": db.query(ForumReply).filter(ForumReply.post_id == p.id).count(),
            "liked": False,
            "created_at": p.created_at.isoformat() if p.created_at else None
        } for p in posts],
        "stats": {"members": 45, "topScore": 5680}
    }


@router.post("")
async def create_post(req: ForumPostRequest, db: Session = Depends(get_db)):
    post = ForumPost(author=req.author, content=req.content)
    db.add(post)
    db.commit()
    db.refresh(post)
    return {
        "post": {
            "id": post.id,
            "avatar": post.author[0],
            "author": post.author,
            "time": "刚刚",
            "content": post.content,
            "likes": 0,
            "replies": 0,
            "liked": False
        }
    }


@router.post("/{post_id}/like")
async def like_post(post_id: int, db: Session = Depends(get_db)):
    post = db.query(ForumPost).filter(ForumPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="留言不存在")
    post.likes += 1
    db.commit()
    return {"likes": post.likes}


@router.post("/{post_id}/reply")
async def reply_post(post_id: int, req: ForumReplyRequest, db: Session = Depends(get_db)):
    post = db.query(ForumPost).filter(ForumPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="留言不存在")
    reply = ForumReply(post_id=post_id, author=req.author, content=req.content)
    db.add(reply)
    db.commit()
    return {"reply": {"id": reply.id, "author": reply.author, "content": reply.content, "time": "刚刚"}}


@router.get("/{post_id}/replies")
async def get_replies(post_id: int, db: Session = Depends(get_db)):
    replies = db.query(ForumReply).filter(ForumReply.post_id == post_id).order_by(ForumReply.created_at).all()
    return {"replies": [{
        "id": r.id,
        "author": r.author,
        "content": r.content,
        "time": _format_time(r.created_at)
    } for r in replies]}
