import os
from dotenv import load_dotenv

load_dotenv()

DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY", "")
DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions"
DEEPSEEK_MODEL = "deepseek-chat"

DATABASE_URL = f"sqlite:///{os.path.join(os.path.dirname(os.path.dirname(__file__)), 'app.db')}"

CORS_ORIGINS = ["*"]
