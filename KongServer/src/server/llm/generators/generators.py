from src.KongBot.bot.base import KnowledgeGraph
from src.KongBot.bot.adapters import dash_tree_to_json

from ..query import GenEssayFromTree, GenTree
import json

def generate_tree(graph: KnowledgeGraph) -> KnowledgeGraph:
    config = graph.config["gen_tree_essay"]
    tree = GenTree(graph.curriculum, **config).get_llm_output()
    tree_json = dash_tree_to_json(tree, graph.curriculum)
    
    graph.from_json(tree_json)
    return graph

def generate_essay_from_tree(graph: KnowledgeGraph) -> str:
    nodes_details_query = GenEssayFromTree(graph.curriculum, 
                                           graph.display_tree()).get_llm_output()
    return nodes_details_query