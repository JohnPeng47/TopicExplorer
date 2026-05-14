from src.server.routes.graph.schema import NodeId, DocumentId
from typing import List
from pydantic import BaseModel
from typing import Optional

class DocumentData(BaseModel):
    id: DocumentId
    text: str
    subgraph_id: NodeId

class Document(BaseModel):
    id: DocumentId
    data: DocumentData

class DocumentList(BaseModel):
    graph_id: NodeId
    documents: List[Document]