from pydantic import BaseModel
from typing import Optional, List

class RegisterRequest(BaseModel):
    name: str
    studentId: str

class LoginRequest(BaseModel):
    studentId: str

class UserResponse(BaseModel):
    id: int
    name: str
    studentId: str
    points: int
    level: str

    class Config:
        from_attributes = True

class ChatRequest(BaseModel):
    message: str
    agent_type: str
    lesson_id: Optional[int] = None
    history: Optional[List[dict]] = []

class ChatResponse(BaseModel):
    reply: str

class ForumPostRequest(BaseModel):
    content: str
    author: str

class ForumReplyRequest(BaseModel):
    content: str
    author: str

class ForumPostResponse(BaseModel):
    id: int
    avatar: str
    author: str
    time: str
    content: str
    likes: int
    replies: int
    liked: bool

    class Config:
        from_attributes = True

class WrongAnswerRequest(BaseModel):
    lesson_id: int
    lesson_title: str
    question: str
    user_answer: str
    correct_answer: str
    question_type: str

class ProgressUpdateRequest(BaseModel):
    progress: float
