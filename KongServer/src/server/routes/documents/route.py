from fastapi import APIRouter, Depends, Body, Path, HTTPException
from fastapi.responses import JSONResponse

from .schema import Document, DocumentList
from .service import (
    get_document_list_db, 
    insert_document_list_db, 
    get_document_from_list_db, 
    update_document_in_list_db, 
    delete_document_db
)
from ..auth.service import get_user_from_token
from ..auth.schema import User

document_router = APIRouter()

@document_router.get("/documents/{graph_id}", response_model=DocumentList)
def get_document_list_route(
    graph_id: str = Path(..., title="The ID of the graph"),
    user: User = Depends(get_user_from_token)
):
    document_list = get_document_list_db(graph_id, user.id)
    if not document_list:
        # raise HTTPException(status_code=400, detail="Document list not found")
        return DocumentList(graph_id=graph_id, documents=[])
    return document_list

@document_router.post("/documents/{graph_id}/add", response_model=Document)
def add_document_route(
    graph_id: str,
    document: Document,
    user: User = Depends(get_user_from_token)
):
    document_list = get_document_list_db(graph_id, user.id)
    if not document_list:
        document_list = DocumentList(graph_id=graph_id, documents=[])
    
    document_list.documents.append(document)
    insert_document_list_db(document_list, user.id)
    return document

@document_router.delete("/documents/{graph_id}/{doc_id}", response_model=dict)
def delete_document_route(
    graph_id: str,
    doc_id: str = Path(..., title="The ID of the document to delete"),
    user: User = Depends(get_user_from_token)
):
    document_list = get_document_list_db(graph_id, user.id)
    if not document_list:
        raise HTTPException(status_code=404, detail="Document list not found")
    
    document_list.documents = [doc for doc in document_list.documents if doc.id != doc_id]
    insert_document_list_db(document_list, user.id)
    delete_document_db(doc_id, user.id)
    return {"status": "success", "message": "Document deleted"}

@document_router.put("/documents/{graph_id}/{node_id}", response_model=Document)
def update_document_route(
    graph_id: str = Path(..., title="The ID of the graph"),
    node_id: str = Path(..., title="The ID of the document to update"),
    updated_document: Document = Body(..., title="The updated document"),
    user: User = Depends(get_user_from_token)
):
    if node_id != updated_document.node_id:
        raise HTTPException(status_code=400, detail="Node ID mismatch")
    
    result = update_document_in_list_db(graph_id, updated_document, user.id)
    if not result:
        raise HTTPException(status_code=404, detail="Document not found")
    
    return updated_document