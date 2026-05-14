from .schema import *
from .service import *

from fastapi import APIRouter, Depends, Body, Query, Response
from fastapi.responses import JSONResponse
from fastapi.requests import Request
from fastapi import HTTPException

from networkx.exception import NetworkXError

from src.server.llm.query import GenParagraphFromSubtree, GenParagraphFromSubtreeV2, GenerateReport
from src.server.llm.generators import generate_subtree

from src.KongBot.bot.base import KnowledgeGraph
from src.KongBot.bot.explorationv2.llm import GenSubTreeQueryV2, GenSubTreeQueryV3
from src.KongBot.bot.adapters.ascii_tree_to_kg import ascii_tree_to_kg_v2
from src.KongBot.bot.explorationv2 import generate_short_description

# from KongBot.server.bot.base.exceptions import GeneratorException
# TODO: have to import exceptions from here or else they conflict
# need to fix Python module setup
from src.KongBot.bot.base.exceptions import GeneratorException

from typing import List
import json
from logging import getLogger

from ..auth.service import get_user_from_token

logger = getLogger("base")

router = APIRouter()


@router.get("/metadata/", response_model=List[GraphMetadataResp])
def get_graph_metadata_route(user: User = Depends(get_user_from_token)):
    metadata_list = []
    # consider returning a cursor here to be more memory efficient
    # although the pagination limit should do the trick?
    metadatas = list_graph_metadata_db(user.id)
    for document in metadatas:
        metadata_list.append(document)
    return metadata_list


@router.get("/graph/{graph_id}")
def get_graph_route(graph_id: str, 
                    user: User = Depends(get_user_from_token)):
    
    kg = get_graph(graph_id, user.id)

    # print(kg.to_json_frontend())
    return json.loads(kg.to_json_frontend())


# TODO: Remove graph_id from this function and move delete button on UI to
# treeNode page once the graph has been selected
@router.get("/graph/delete/{graph_id}")
def delete_graph_route(
    graph_id: str, request: Request, user: User = Depends(get_user_from_token)
):
    delete_graph_db(graph_id, user.id)
    delete_graph_metadata_db(graph_id, user.id)

### These routes actually perform graph modification
@router.get("/graph/generate/{graph_id}")
def generate_graph_route(
    graph_id: str,
    user: User = Depends(get_user_from_token),
):
    kg = get_graph(graph_id, user.id)
    title = get_graph_metadata_db(graph_id)["metadata"]["title"]
    config = {
        "global": {"subtree_size": 2},
        "generate_short_description": {
            "cache_policy": "default",
            "model": "gpt3",
        },
    }
    kg.add_config(config=config)
    kg.add_generators([generate_short_description])
    success = kg.generate_nodes()
    save_graph(kg, user.id, title=title)

    return success


@router.post("/graph/update/{graph_id}")
def update_graph_route(
    graph_id: str,
    rf_graph: RFNode,
    response: Response,
    user: User = Depends(get_user_from_token),
):
    kg = get_graph(graph_id, user.id)
    kg_graph = rfnode_to_kgnode(rf_graph)
    kg.add_node(kg_graph, merge=True)

    save_graph(kg, user.id)
    response.headers["Allow"] = "POST"

    return {"status": "success"}


@router.post("/gen/subgraph/{graph_id}", response_model=GraphNode)
def gen_subgraph_route(
    graph_id: str,
    request: GenParagraphRequest = Body(...),
    user: User = Depends(get_user_from_token),
):
    kg = get_graph(graph_id, user.id)
    rf_subgraph_json = rfnode_to_kgnode(request.subgraph)
    # get the old
    old_node = kg.get_node(request.subgraph.id)

    # unknown race condition here
    try:
        kg.add_node(rf_subgraph_json, merge=True)
    except NetworkXError as e:
        # subgraph_id, subgraph_title = rf_subgraph_json["id"], rf_subgraph_json["id"]["node_data"]["title"]
        logger.error("Error in subgraph add_node")
        logger.error(e)
        # return the old node here so that at least frontend state can be kept clean
        return JSONResponse(
            status_code=400, content=json.loads(kg.to_json_frontend(node=old_node))
        )

    tree1, tree2, _ = kg.display_tree_v2_lineage(rf_subgraph_json["id"])
    retry, success = 6, False
    default_model = "gpt3"
    while retry > 0 and not success:
        try:
            subtree = GenSubTreeQueryV2(
                kg.curriculum,
                tree1 + tree2,
                cache_policy="default",
                model=default_model,
            ).get_llm_output()

            parent_ids = kg.parents(rf_subgraph_json["id"])
            parent = kg.get_node(parent_ids[0]) if len(parent_ids) > 0 else {}
            subtree_node_new = ascii_tree_to_kg_v2(subtree, rf_subgraph_json, parent)
            kg.add_node(subtree_node_new, merge=True)
            save_graph(kg, user.id)

            return JSONResponse(
                status_code=200,
                content=json.loads(kg.to_json_frontend(node=subtree_node_new)),
            )
        except GeneratorException as e:
            # to increment it by one
            logger.error(
                f"Retry attempt {6 - retry + 1}, use model: {default_model}, error: {e}"
            )
            retry -= 1
            if retry <= 3:
                default_model = "gpt4"
            continue

    raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/graph/create")
def create_graph_route(request: CreateGraphRequest, user: User = Depends(get_user_from_token)):
    kg: KnowledgeGraph = create_graph(request.curriculum, request.title)
    root_id = kg.get_root()["id"]
    # not yet, because frontend is still waiting for metadata request to render
    # kg = generate_subtree(kg, root_id, model="gpt4")

    save_graph(kg, user.id, title=request.title)
    return {"graph_id": root_id}

from .lock import lock_graph


def get_tree_router(graph_manager: GraphManager) -> APIRouter:
    router = APIRouter()
    graph_lock = lock_graph(graph_manager)
    
    @router.post("/gen/paragraph/subgraph/{graph_id}")
    def gen_subgraph_paragraph(
        graph_id: str,
        request: GenParagraphRequest = Body(...),
        user: User = Depends(get_user_from_token),
    ):
        """
        Methods takes current subtree_id as maintopic, and uses rest of ancestors as
        context for generating a single paragraph on the maintopic
        """
        subgraph_id, model = request.subgraph_id, request.model
        kg = graph_manager.get_graph(graph_id, user.id)

        ancestor_tree, subtree, curr_title = kg.display_tree_v2_lineage(subgraph_id)
        # TODO: some sort of heuristic for determining what kind of text to generate
        paragraph = GenParagraphFromSubtreeV2(
            ancestor_tree + subtree, curr_title, model=request.model
        ).get_llm_output()

        return {
            "paragraph": paragraph
        }
    
    @router.post("/gen/report/subgraph/{graph_id}")
    def gen_subgraph_report(
        graph_id: str,
        request: GenParagraphRequest,
        user: User = Depends(get_user_from_token),
    ):
        """
        Methods takes current subtree_id as main topic, and uses rest of ancestors as
        context for generating a single paragraph on the maintopic
        """
        kg = graph_manager.get_graph(graph_id, user.id)
        tree = kg.display_tree(request.subgraph_id, lineage=True)

        report = GenerateReport(tree, model=request.model).get_llm_output()
        print("Generating report with: ", tree, request.model)

        # TODO: think about how we want to modify our nodes
        # kg.modify_node(subgraph_id, {"description": paragraph})
        # modified_node = kg.get_node(subgraph_id)

        return {
            "report": report
        }

    @router.post("/graph/v2/update/{graph_id}")
    @graph_lock
    def update_graph_route(
        graph_id: str,
        rf_graph: RFNode,
        response: Response,
        user: User = Depends(get_user_from_token),
    ):
        kg = graph_manager.get_graph(graph_id, user.id)
        kg_graph = rfnode_to_kgnode(rf_graph)
        kg.add_node(kg_graph, merge=True)

        save_graph(kg, user.id)
        response.headers["Allow"] = "POST"

        return {"status": "success"}

    @router.post("/graph/v2/subgraph/tree/{graph_id}")
    @graph_lock
    def get_subgraph_tree(
        graph_id: str,
        request: GetSubgraphTree = Body(...),
        user: User = Depends(get_user_from_token),
    ):
        kg: KnowledgeGraph = graph_manager.get_graph(graph_id, user.id)
        tree = kg.display_tree(request.subgraph_id, lineage=True)

        return {
            "tree": tree
        }

    @router.post("/gen/v2/subgraph/{graph_id}", response_model=GraphNode)
    @graph_lock
    def gen_subgraph_topics(
        graph_id: str,
        request: GenSubgraphTopicsRequest = Body(...),
        user: User = Depends(get_user_from_token),
    ):
        kg = graph_manager.get_graph(graph_id, user.id)
        rf_subgraph_json = rfnode_to_kgnode(request.subgraph)
        old_node = kg.get_node(request.subgraph.id)

        # TODO: not ideal to have a state update here
        # ideally we should consolidate all state update functions in one, update graph
        # think it basically works rn, just need to get rid of the JSON here
        try:
            kg.add_node(rf_subgraph_json, merge=True)
        except NetworkXError as e:
            logger.error("Error in subgraph add_node")
            logger.error(e)
            # return the old node here so that at least frontend state can be kept clean
            return JSONResponse(
                status_code=400, content=json.loads(kg.to_json_frontend(node=old_node))
            )

        kg = generate_subtree(
            kg, rf_subgraph_json["id"], request.llmInstr, model=request.model
        )

        subtree_node_new = kg.get_node(rf_subgraph_json["id"])
        kg.add_node(subtree_node_new, merge=True)

        save_graph(kg, user.id)

        return JSONResponse(
            status_code=200,
            content=json.loads(kg.to_json_frontend(node=subtree_node_new)),
        )

    return router
