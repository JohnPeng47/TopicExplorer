from pydantic import BaseModel
from enum import Enum

class OpenAIModel(Enum):
    GPT3 = "gpt3"
    GPT4 = "gpt4"