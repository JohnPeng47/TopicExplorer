from src.KongBot.bot.base import KnowledgeGraph
from src.KongBot.bot.adapters import dash_tree_to_json, ascii_tree_to_kg_v2
from src.KongBot.bot.base.exceptions import GeneratorException

from ..query import GenEssayFromTree, GenTree, GenSubTreeQueryV3
from ..schema import OpenAIModel

from logging import getLogger

logger = getLogger("base")

LLM_INSTR_PRE = """
Apply the following additional insructions to generating the subtree:
{}
"""

def generate_tree(graph: KnowledgeGraph) -> KnowledgeGraph:
    config = graph.config["gen_tree_essay"]
    tree = GenTree(graph.curriculum, **config).get_llm_output()
    tree_json = dash_tree_to_json(tree, graph.curriculum)
    
    graph.from_json(tree_json)
    return graph


def generate_subtree(graph: KnowledgeGraph, 
                     subgrah_id: str,
                     llm_instr: str,
                     model: OpenAIModel = "gpt3") -> KnowledgeGraph:
    ancestors, subtree, _ = graph.display_tree_v2_lineage(subgrah_id)
    subgraph_json = graph.get_node(subgrah_id)
    retry, success = 6, False
    while retry > 0 and not success:
        try:
            llm_instr = LLM_INSTR_PRE.format(llm_instr) if llm_instr else ""
            subtree = GenSubTreeQueryV3(graph.curriculum,
                                        ancestors,
                                        subtree,
                                        llm_instr,
                                        cache_policy="default",
                                        model=model).get_llm_output()

            parent_ids = graph.parents(subgrah_id)
            parent = graph.get_node(parent_ids[0]) if len(parent_ids) > 0 else {}
            # converts the subtree to json
            subtree_node_new = ascii_tree_to_kg_v2(subtree, subgraph_json, parent)
            graph.add_node(subtree_node_new, merge=True)

            return graph
        except GeneratorException as e:
            # to increment it by one
            logger.error(
                f"Retry attempt {6 - retry + 1}, use model: {default_model}, error: {e}")
            retry -= 1
            if retry <= 3:
                default_model = "gpt4"
            continue




# def generate_essay_from_tree(graph: KnowledgeGraph) -> str:
#     nodes_details_query = GenEssayFromTree(graph.curriculum, 
#                                            graph.display_tree()).get_llm_output()
#     return nodes_details_query