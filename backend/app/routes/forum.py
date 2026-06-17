from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from ..database import get_db
from ..models import ForumPost, ForumReply, User, LessonProgress
from ..schemas import ForumPostRequest, ForumReplyRequest
from datetime import datetime, timezone, timedelta

router = APIRouter(prefix="/api/forum", tags=["forum"])

# 不良关键词过滤列表
FILTER_WORDS = ["傻逼", "fuck", "shit", "垃圾平台", "草泥马"]


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
    if seconds < 604800:
        return f"{seconds // 86400}天前"
    return dt.strftime("%m月%d日")


def filter_content(text: str) -> tuple:
    """过滤敏感词，返回 (过滤后文本, 是否被过滤)"""
    filtered = text
    was_filtered = False
    for word in FILTER_WORDS:
        if word in filtered:
            filtered = filtered.replace(word, "***")
            was_filtered = True
    return filtered, was_filtered


def _get_student_id(request: Request) -> str:
    """从请求头获取学号"""
    return request.headers.get("X-Student-Id", "")


def _add_points(db: Session, student_id: str, amount: int, user_name: str = None):
    """给用户加积分，自动更新等级"""
    if not student_id:
        return
    user = db.query(User).filter(User.student_id == student_id).first()
    if user:
        user.points = (user.points or 0) + amount
        _update_level(user)
        db.commit()


def _update_level(user: User):
    """根据积分更新等级"""
    pts = user.points or 0
    if pts >= 2001:
        user.level = "年级楷模"
    elif pts >= 1001:
        user.level = "班级学霸"
    elif pts >= 601:
        user.level = "学习达人"
    elif pts >= 301:
        user.level = "积极分子"
    elif pts >= 101:
        user.level = "勤奋学子"
    else:
        user.level = "新手学员"


@router.get("/stats")
async def get_forum_stats(db: Session = Depends(get_db)):
    """获取论坛统计和本周之星"""
    # 本周起止时间
    now = datetime.now(timezone.utc)
    week_start = now - timedelta(days=now.weekday())
    week_start = week_start.replace(hour=0, minute=0, second=0, microsecond=0)

    # 本周发帖最多的用户
    weekly_posts = db.query(
        ForumPost.author, func.count(ForumPost.id).label("cnt")
    ).filter(
        ForumPost.created_at >= week_start
    ).group_by(ForumPost.author).order_by(desc("cnt")).limit(5).all()

    # 总积分最高的用户
    top_users = db.query(User).order_by(desc(User.points)).limit(5).all()

    # 总帖数
    total_posts = db.query(ForumPost).count()
    # 注册用户数
    member_count = db.query(User).count()

    return {
        "stats": {
            "totalPosts": total_posts,
            "members": max(member_count, 45),
            "weeklyStars": [
                {"author": u.name or u.student_id, "points": u.points or 0}
                for u in top_users
            ] if top_users else [],
            "topScore": top_users[0].points if top_users else 5680
        }
    }


@router.get("")
async def get_posts(
    request: Request,
    sort: str = "latest",
    search: str = "",
    db: Session = Depends(get_db)
):
    """获取帖子列表，支持排序和搜索"""
    query = db.query(ForumPost)

    # 搜索过滤
    if search:
        query = query.filter(ForumPost.content.contains(search))

    # 排序
    if sort == "hot":
        query = query.order_by(desc(ForumPost.likes), desc(ForumPost.created_at))
    else:
        query = query.order_by(desc(ForumPost.created_at))

    posts = query.limit(50).all()
    student_id = _get_student_id(request)

    # 批量获取回复数
    post_ids = [p.id for p in posts]
    reply_counts = {}
    if post_ids:
        reply_data = db.query(
            ForumReply.post_id, func.count(ForumReply.id)
        ).filter(ForumReply.post_id.in_(post_ids)).group_by(ForumReply.post_id).all()
        reply_counts = {pid: cnt for pid, cnt in reply_data}

    return {
        "posts": [{
            "id": p.id,
            "avatar": p.author[0] if p.author else "?",
            "author": p.author,
            "time": _format_time(p.created_at),
            "content": p.content,
            "likes": p.likes or 0,
            "replies": reply_counts.get(p.id, 0),
            "liked": False,
            "created_at": p.created_at.isoformat() if p.created_at else None
        } for p in posts]
    }


@router.post("")
async def create_post(req: ForumPostRequest, request: Request, db: Session = Depends(get_db)):
    """创建帖子，含敏感词过滤和积分奖励"""
    # 内容过滤
    filtered_content, was_filtered = filter_content(req.content)

    post = ForumPost(author=req.author, content=filtered_content)
    db.add(post)
    db.commit()
    db.refresh(post)

    # 发帖奖励积分
    student_id = _get_student_id(request)
    _add_points(db, student_id, 5, req.author)

    return {
        "post": {
            "id": post.id,
            "avatar": post.author[0] if post.author else "?",
            "author": post.author,
            "time": "刚刚",
            "content": filtered_content,
            "likes": 0,
            "replies": 0,
            "liked": False,
            "filtered": was_filtered
        },
        "pointsEarned": 5
    }


@router.post("/{post_id}/like")
async def like_post(post_id: int, request: Request, db: Session = Depends(get_db)):
    """点赞帖子，给被赞者+2积分"""
    post = db.query(ForumPost).filter(ForumPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="留言不存在")
    post.likes = (post.likes or 0) + 1
    db.commit()

    # 给被赞者加积分（通过 author 查找学号）
    like_user = db.query(User).filter(User.name == post.author).first()
    if like_user:
        _add_points(db, like_user.student_id, 2, post.author)

    return {"likes": post.likes, "pointsEarned": 2}


@router.post("/{post_id}/reply")
async def reply_post(post_id: int, req: ForumReplyRequest, request: Request, db: Session = Depends(get_db)):
    """回复帖子，含敏感词过滤和积分奖励"""
    post = db.query(ForumPost).filter(ForumPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="留言不存在")

    filtered_content, was_filtered = filter_content(req.content)

    reply = ForumReply(post_id=post_id, author=req.author, content=filtered_content)
    db.add(reply)
    db.commit()
    db.refresh(reply)

    # 回复奖励积分
    student_id = _get_student_id(request)
    _add_points(db, student_id, 3, req.author)

    return {
        "reply": {
            "id": reply.id,
            "author": reply.author,
            "content": filtered_content,
            "time": "刚刚"
        },
        "pointsEarned": 3,
        "filtered": was_filtered
    }


@router.get("/{post_id}/replies")
async def get_replies(post_id: int, db: Session = Depends(get_db)):
    """获取某帖子的回复列表"""
    replies = db.query(ForumReply).filter(
        ForumReply.post_id == post_id
    ).order_by(ForumReply.created_at).all()
    return {"replies": [{
        "id": r.id,
        "author": r.author,
        "content": r.content,
        "time": _format_time(r.created_at)
    } for r in replies]}


@router.delete("/{post_id}")
async def delete_post(post_id: int, request: Request, db: Session = Depends(get_db)):
    """删除帖子（仅作者可删）"""
    post = db.query(ForumPost).filter(ForumPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="留言不存在")

    student_id = _get_student_id(request)
    user = db.query(User).filter(User.student_id == student_id).first()
    if not user or user.name != post.author:
        raise HTTPException(status_code=403, detail="只能删除自己的留言")

    # 删除关联回复
    db.query(ForumReply).filter(ForumReply.post_id == post_id).delete()
    db.delete(post)
    db.commit()
    return {"success": True}


@router.get("/user/points")
async def get_user_points(request: Request, db: Session = Depends(get_db)):
    """获取当前用户的积分和等级"""
    student_id = _get_student_id(request)
    if not student_id:
        return {"points": 0, "level": "新手学员"}

    user = db.query(User).filter(User.student_id == student_id).first()
    if not user:
        return {"points": 0, "level": "新手学员"}

    return {"points": user.points or 0, "level": user.level or "新手学员"}
