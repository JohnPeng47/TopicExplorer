from src.server.database.db import DBConnection
from src.server.routes.graph.schema import NodeId

from .schema import Document, DocumentList, DocumentData

from logging import getLogger
from threading import Lock

logger = getLogger("base")
db_conn = DBConnection()

def insert_document_db(document: Document, user_id: str):
    return db_conn.get_collection("documents").update_one(
        {"id": document.id, "user_id": user_id},
        {
            "$set": {
                "data": document.data,
            }
        },
        upsert=True,
    )

def get_document_db(node_id: NodeId, user_id: str):
    document = db_conn.get_collection("documents").find_one(
        {"id": node_id, "user_id": user_id}
    )
    return Document(**document) if document else None

def delete_document_db(node_id: NodeId, user_id: str):
    return db_conn.get_collection("documents").delete_one(
        {"id": node_id, "user_id": user_id}
    )

def insert_document_list_db(document_list: DocumentList, user_id: str):
    # print("Inserting into document ", document_list.graph_id, user_id, document_list.documents)
    return db_conn.get_collection("document_lists").update_one(
        {"graph_id": document_list.graph_id, "user_id": user_id},
        {
            "$set": {
                "documents": [doc.dict() for doc in document_list.documents],
            }
        },
        upsert=True,
    )

def get_document_list_db(graph_id: NodeId, user_id: str):
    document_list = db_conn.get_collection("document_lists").find_one(
        {"graph_id": graph_id, "user_id": user_id}
    )
    # print("Getting document list: ", graph_id, user_id, document_list)
    if document_list:
        return DocumentList(
            graph_id=document_list["graph_id"],
            documents=[Document(**doc) for doc in document_list["documents"]]
        )
    return None

def delete_document_list_db(graph_id: NodeId, user_id: str):
    return db_conn.get_collection("document_lists").delete_one(
        {"graph_id": graph_id, "user_id": user_id}
    )

# Helper function to get a specific document from a document list
def get_document_from_list_db(graph_id: NodeId, node_id: NodeId, user_id: str):
    document_list = get_document_list_db(graph_id, user_id)
    if document_list:
        for doc in document_list.documents:
            if doc.id == node_id:
                return doc
    return None

# Helper function to update a specific document in a document list
def update_document_in_list_db(graph_id: NodeId, document: Document, user_id: str):
    document_list = get_document_list_db(graph_id, user_id)
    if document_list:
        updated_documents = [doc if doc.id != document.id else document for doc in document_list.documents]
        updated_list = DocumentList(graph_id=graph_id, documents=updated_documents)
        return insert_document_list_db(updated_list, user_id)
    return None

# Helper function to update document data
def update_document_data_db(node_id: NodeId, document_data: DocumentData, user_id: str):
    return db_conn.get_collection("documents").update_one(
        {"id": node_id, "user_id": user_id},
        {
            "$set": {
                "data": document_data.dict(),
            }
        },
    )