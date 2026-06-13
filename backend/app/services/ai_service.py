"""AI 对话服务 - 调用 DeepSeek API"""

import httpx
import json
import logging
from ..config import DEEPSEEK_API_KEY, DEEPSEEK_API_URL, DEEPSEEK_MODEL
from .knowledge_base import AGENT_SYSTEM_PROMPTS, find_knowledge_answer, get_lesson_context

logger = logging.getLogger(__name__)


async def chat_with_ai(
    message: str,
    agent_type: str,
    lesson_id: int = None,
    history: list = None
) -> str:
    """调用 DeepSeek API 生成回复

    如果 API Key 未配置或调用失败，使用本地知识库回退
    """
    if not DEEPSEEK_API_KEY:
        logger.warning("DEEPSEEK_API_KEY not configured, using local knowledge base")
        return _local_reply(message, agent_type, lesson_id)

    system_prompt = AGENT_SYSTEM_PROMPTS.get(agent_type, AGENT_SYSTEM_PROMPTS["tutor"])
    lesson_context = get_lesson_context(lesson_id) if lesson_id else ""

    if lesson_context:
        system_prompt += f"\n\n学生当前正在学习的内容：\n{lesson_context}\n\n请结合以上课程内容回答学生的问题。"

    messages = [
        {"role": "system", "content": system_prompt},
    ]

    if history:
        for msg in history[-10:]:
            messages.append({"role": msg.get("role", "user"), "content": msg.get("content", "")})

    messages.append({"role": "user", "content": message})

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                DEEPSEEK_API_URL,
                headers={
                    "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": DEEPSEEK_MODEL,
                    "messages": messages,
                    "temperature": 0.7,
                    "max_tokens": 500
                }
            )

            if response.status_code == 200:
                result = response.json()
                return result["choices"][0]["message"]["content"]
            else:
                logger.error(f"DeepSeek API error: {response.status_code} - {response.text}")
                return _local_reply(message, agent_type, lesson_id)

    except Exception as e:
        logger.error(f"DeepSeek API call failed: {str(e)}")
        return _local_reply(message, agent_type, lesson_id)


def _local_reply(question: str, agent_type: str, lesson_id: int = None) -> str:
    """本地知识库回退方案"""
    # 先尝试匹配知识库
    knowledge_answer = find_knowledge_answer(question)
    if knowledge_answer:
        if agent_type == "guider":
            return f"关于这个问题，我来帮你梳理一下思路：{knowledge_answer}"
        else:
            return f"让我来帮你详细讲解：{knowledge_answer}"

    # 尝试匹配课时内容
    lesson_context = get_lesson_context(lesson_id) if lesson_id else ""
    if lesson_context and any(kw in question for kw in ["什么", "怎么", "如何", "？", "?"]):
        if agent_type == "guider":
            return f"你问的内容与当前所学课程有关！我来给你介绍一下：\n\n{lesson_context}\n\n加油哦！我们一起进步～"
        else:
            return f"让我结合当前课程内容帮你分析：\n\n{lesson_context}\n\n理解了这些，问题就容易解决啦！"

    # 通用回复
    if question.endswith("？") or question.endswith("?"):
        if agent_type == "guider":
            return f"关于「{question}」，这是一个很好的问题！建议你先回顾一下相关的课程内容，理解基本概念后，再试着用自己的话解释一遍。如果还有疑问，随时问我哦～"
        else:
            return f"让我来分析「{question}」这个问题。首先我们要理解它的核心概念，然后再看具体的应用。你目前学到哪个部分了？我可以结合具体内容帮你讲解。"

    if agent_type == "guider":
        return f"好问题！「{question}」是学习算法与程序设计的重要部分。建议你先完成对应的课时学习，然后做一些练习题巩固。需要我帮你规划一下学习路径吗？"
    else:
        return f"关于「{question}」，我来帮你分析一下。你可以先想想这个问题涉及哪个知识点？我们一步一步来解决它。"
