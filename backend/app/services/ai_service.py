"""AI 对话服务 - 调用 DeepSeek API"""

import httpx
import logging
from ..config import DEEPSEEK_API_KEY, DEEPSEEK_API_URL, DEEPSEEK_MODEL
from .knowledge_base import AGENT_SYSTEM_PROMPTS, find_knowledge_answer, get_lesson_context

logger = logging.getLogger(__name__)

# 不同智能体的参数配置
AGENT_CONFIG = {
    "guider": {
        "temperature": 0.85,   # 偏高：引导式提问需要更多创造性
        "max_tokens": 600,     # 适中：引导者每次只说一个问题和简短点评
    },
    "tutor": {
        "temperature": 0.7,    # 适中偏低：答疑需要准确性和一致性
        "max_tokens": 800,     # 稍多：答疑需要充分解释
    }
}


async def chat_with_ai(
    message: str,
    agent_type: str,
    lesson_id: int = None,
    history: list = None
) -> str:
    """调用 DeepSeek API 生成智能回复

    如果 API Key 未配置或调用失败，使用本地知识库回退。
    """

    # 获取系统提示词
    system_prompt = AGENT_SYSTEM_PROMPTS.get(agent_type, AGENT_SYSTEM_PROMPTS["tutor"])

    # 附加当前课时上下文
    lesson_context = get_lesson_context(lesson_id) if lesson_id else ""
    if lesson_context:
        system_prompt += f"\n\n【学生当前正在学习的课时内容】\n{lesson_context}\n\n请结合以上课时内容进行教学。如果学生的问题涉及当前课时内容，优先围绕该课时展开引导/讲解。"

    # 如果没有 API Key，回退到本地
    if not DEEPSEEK_API_KEY:
        logger.warning("DEEPSEEK_API_KEY not configured, using local knowledge base")
        return _local_reply(message, agent_type, lesson_id)

    # 获取智能体专属参数
    config = AGENT_CONFIG.get(agent_type, AGENT_CONFIG["tutor"])

    # 构建消息列表
    messages = [{"role": "system", "content": system_prompt}]

    # 保留最近10轮对话历史（保持上下文连贯）
    if history:
        for msg in history[-20:]:  # 最近20条消息 ≈ 10轮对话
            role = msg.get("role", "user")
            content = msg.get("content", "")
            if content and content.strip():
                messages.append({"role": role, "content": content})

    # 添加当前消息
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
                    "temperature": config["temperature"],
                    "max_tokens": config["max_tokens"],
                    "top_p": 0.9,
                }
            )

            if response.status_code == 200:
                result = response.json()
                reply = result["choices"][0]["message"]["content"]
                logger.info(f"AI reply generated for {agent_type}: {len(reply)} chars")
                return reply
            else:
                logger.error(f"DeepSeek API error: {response.status_code} - {response.text[:200]}")
                return _local_reply(message, agent_type, lesson_id)

    except httpx.TimeoutException:
        logger.error("DeepSeek API timeout")
        return _local_reply(message, agent_type, lesson_id)
    except Exception as e:
        logger.error(f"DeepSeek API call failed: {str(e)}")
        return _local_reply(message, agent_type, lesson_id)


def _local_reply(question: str, agent_type: str, lesson_id: int = None) -> str:
    """本地知识库回退方案 — 当 AI API 不可用时使用"""

    # 尝试匹配知识库
    knowledge_answer = find_knowledge_answer(question)
    if knowledge_answer:
        if agent_type == "guider":
            return (
                f"（目前AI助手暂时不可用，我先用本地知识库帮你）\n\n"
                f"{knowledge_answer}\n\n"
                f"💡 小提示：试着用自己的话复述一遍上面的内容，理解会更深刻哦！\n"
                f"加油～有问题随时问我！"
            )
        else:
            return (
                f"（目前AI助手暂时不可用，我先用本地知识库帮你）\n\n"
                f"{knowledge_answer}\n\n"
                f"💡 如果还有不清楚的地方，换个方式问我，我继续帮你讲解～"
            )

    # 获取课时上下文
    lesson_context = get_lesson_context(lesson_id) if lesson_id else ""

    # 无匹配时的智能引导
    if agent_type == "guider":
        if lesson_context:
            return (
                f"（目前AI助手暂时不可用）\n\n"
                f"关于「{question}」，这是你当前学习内容的一部分：\n\n"
                f"{lesson_context}\n\n"
                f"💡 建议：先仔细阅读上面的知识点，然后试着用自己的话解释一遍。\n"
                f"理解之后再做几道练习题巩固一下，加油哦！💪"
            )
        return (
            f"（目前AI助手暂时不可用）\n\n"
            f"关于「{question}」，建议你：\n"
            f"① 回顾课本对应章节的内容\n"
            f"② 看看课时里的知识点讲解\n"
            f"③ 做几道相关练习题巩固理解\n\n"
            f"需要我帮你规划更具体的学习计划吗？😊"
        )
    else:
        if lesson_context:
            return (
                f"（目前AI助手暂时不可用）\n\n"
                f"关于「{question}」，结合当前课程内容：\n\n"
                f"{lesson_context}\n\n"
                f"💡 理解了基础概念后，做几道练习题检验一下。\n"
                f"如果还有具体问题，可以换个方式问我～"
            )
        return (
            f"（目前AI助手暂时不可用）\n\n"
            f"关于「{question}」，我来帮你分析：\n"
            f"建议先确认这个问题属于哪个课时，\n"
            f"然后回顾对应的知识点讲解。\n\n"
            f"你能告诉我你学到哪个课时了吗？这样我能更针对性地帮你～"
        )
