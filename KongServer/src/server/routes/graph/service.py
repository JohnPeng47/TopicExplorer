from typing import Dict
import uuid
from collections import defaultdict

from src.server.database.db import DBConnection

from fastapi import Depends, Body

from .exceptions import GraphAuthorizationError, GraphNotFound
from .schema import GraphMetadata, GenSubgraphTopicsRequest
from ..auth.schema import User


from src.KongBot.bot.base import KnowledgeGraph

from logging import getLogger
from threading import Lock

logger = getLogger("base")
db_conn = DBConnection()

# Should add user auth check as a dependency here, and use this as the entry point
# authz on graph_id
# def get_graph_id(request: GenSubgraphRequest = Body(..., embed=True)) -> str:
#     return request.graph_id


def insert_graph_metadata_db(graph_id: str, metadata: GraphMetadata, user_id: str):
    print("Inserting: ", metadata["title"], user_id)

    return db_conn.get_collection("graph_metadata").update_one(
        {"id": graph_id, "user_id": user_id},
        {
            "$set": {
                "metadata": metadata,
            }
        },
        upsert=True,
    )


def list_graph_metadata_db(user_id: str, pagination=10):
    print("Retrieving for: ", user_id)

    return (
        db_conn.get_collection("graph_metadata")
        .find({"user_id": user_id})
        .sort("timestamp", -1)
        .limit(pagination)
    )


def get_graph_metadata_db(graph_id: str, user_id: str):
    metadata = db_conn.get_collection("graph_metadata").find_one(
        {"id": graph_id, "user_id": user_id}
    )
    return metadata


def delete_graph_metadata_db(graph_id: str, user_id: str):
    return db_conn.get_collection("graph_metadata").delete_one(
        {"id": graph_id, "user_id": user_id}
    )


def insert_graph_db(graph: dict, user_id: str):
    return db_conn.get_collection("graphs").update_one(
        {"id": graph["id"], "user_id": user_id}, {"$set": graph}, upsert=True
    )


def get_graph_db(graph_id: str, user_id: str):
    return db_conn.get_collection("graphs").find_one(
        {
            "id": graph_id,
            "user_id": user_id,
        }
    )


def delete_graph_db(graph_id: str, user_id: str):
    return db_conn.get_collection("graphs").delete_one(
        {
            "id": graph_id,
            "user_id": user_id,
        }
    )


# this should honestly just be a KG initialization function
def create_graph(curriculum: str, title: str) -> KnowledgeGraph:
    new_kg = KnowledgeGraph(curriculum)
    new_kg.add_node(
        {
            "id": str(uuid.uuid4()),
            "node_data": {"title": curriculum, "node_type": "ROOT", "children": []},
        }
    )

    return new_kg


# Dependencies
def check_graph_user_auth(user: User, graph: KnowledgeGraph) -> KnowledgeGraph:
    # raise authorization error
    return True


# TEMP
def get_graph(graph_id: str, user_id: str) -> KnowledgeGraph:
    metadata = get_graph_metadata_db(graph_id, user_id)
    if not metadata:
        raise GraphNotFound

    graph_json = get_graph_db(graph_id, user_id)

    if not graph_json:
        logger.critical("Graph not found but metadata exists: ", metadata)
        raise GraphNotFound

    curriculum = metadata["metadata"]["curriculum"]
    graph = KnowledgeGraph(curriculum)
    graph.from_json(graph_json)

    return graph


def save_graph(graph: KnowledgeGraph, user_id: str, title: str = ""):
    graph_id = graph.get_root()["id"]
    graph_title = title or graph.get_root()["node_data"]["title"]

    print("Saving graph with title: ", graph_title)
    insert_graph_db(graph.to_json(), user_id)
    insert_graph_metadata_db(
        graph_id,
        {
            "curriculum": graph.curriculum,
            "title": graph_title,
            "tree": graph.display_tree(),
        },
        user_id,
    )

    logger.debug(f"Saving graph: {graph_id}")


import time
from threading import Lock
from collections import defaultdict


class GraphManager:
    """
    Class that should be used to manage caching and locking graphs
    Should not be called directly by routes but called internally
    by graph db operation on the service side
    """

    _instance = None
    # TODO: sync with Redis cache eviction
    # https://redis.io/docs/manual/keyspace-notifications/

    def __init__(self):
        self.locks = defaultdict(Lock)

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(GraphManager, cls).__new__(cls)
        return cls._instance

    def acquire_lock(self, graph_id: str):
        lock = self.locks[graph_id]
        lock.acquire()
        logger.debug(f"Lock acquired: {graph_id}")

    def release_lock(self, graph_id: str):
        lock = self.locks.get(graph_id, None)
        if lock is None or not lock.locked():
            raise Exception("Attempt to release an unacquired lock")
        lock.release()
        logger.debug(f"Lock released: {graph_id}")

    def get_graph(self, graph_id: str, user_id: str) -> KnowledgeGraph:
        graph_json = get_graph_db(graph_id, user_id)

        if not graph_json:
            logger.error(f"No graph found for: {graph_id} and user: {user_id}")
            raise GraphNotFound(f"No graph found for: {graph_id}")

        metadata = get_graph_metadata_db(graph_id, user_id)
        curriculum = metadata["metadata"]["curriculum"]
        graph = KnowledgeGraph(curriculum)
        graph.from_json(graph_json)

        return graph

    def save_graph(self, graph: KnowledgeGraph, title: str, user_id: str):
        graph_id = graph.get_root()["id"]
        graph_title = title or graph.get_root()["node_data"]["title"]

        try:
            print("Saving: ", graph.to_json())
            insert_graph_db(graph.to_json(), user_id)
            insert_graph_metadata_db(
                graph_id,
                {
                    "curriculum": graph.curriculum,
                    "title": graph_title,
                    "tree": graph.display_tree(),
                },
                user_id,
            )

            logger.debug(
                f"Saving graph: {graph_id} with title: {graph_title} for user: {user_id}"
            )
        except Exception as e:
            logger.error("Error while saving graph: ", e)

def get_graph_v2(graph_id: str) -> KnowledgeGraph:
    graph_manager = GraphManager()
    return graph_manager.get_graph(graph_id)


def save_graph_v2(graph: KnowledgeGraph, title: str = ""):
    graph_manager = GraphManager()
    return graph_manager.save_graph(graph)
