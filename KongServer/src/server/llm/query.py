from src.KongBot.bot.base.query import BaseLLMQueryV2, BaseLLMQuery
from .prompts import *

class GenTree(BaseLLMQueryV2):
    """
    Generate a tree from the context
    """
    def __init__(self, 
                 context: str,                  
                 model: str = "gpt3",
                 cache_policy: str = "default",
                 json_output: bool = False,
                 evaluate: bool = True):
        super().__init__(json_output=False)
        super().init_prompt(GEN_ESSAY_ROOT_TREE, context=context)

class GenEssayFromTree(BaseLLMQueryV2):
    """
    Generate an essay from the tree outline
    """
    def __init__(self,
                 context: str,
                 tree: str,
                 cache_policy: str = "default",
                 model: str = "gpt4"):
        super().__init__(cache_policy=cache_policy, model=model, json_output=False)
        super().init_prompt(GEN_ESSAY_FROM_TREE, context=context, tree=tree)


class GenParagraphFromSubtree(BaseLLMQueryV2):
    """
    Generate an essay from the subtree outline and context
    """
    def __init__(self,
                 ancestor_context: str,
                 main_topic: str,
                 cache_policy: str = "default",
                 model: str = "gpt3"):
        super().__init__(cache_policy=cache_policy, model=model, json_output=False)
        super().init_prompt(GEN_PARAGRAPH_FROM_TREE, ancestor_context=ancestor_context, main_topic=main_topic)

class GenSubTreeQueryV3(BaseLLMQuery):
    """
    Gen sub tree query v3 with greater separation between ancestor and current context
    """
    def __init__(self,
                 context: str, ancestor_tree: str, subtree: str, 
                 cache_policy: str = "default", model: str = "gpt4"):

        super().__init__(cache_policy=cache_policy, model=model)
        super().init_prompt(SUBTREE_V3, context=context, ancestor_tree=ancestor_tree, subtree=subtree)
