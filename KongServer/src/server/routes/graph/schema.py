from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Union, NewType
import enum

NodeId = NewType("NodeId", str)    
DocumentId = NewType("DocumentId", str)

class Position(BaseModel):
    x: int
    y: int
    
class GraphNodeData(BaseModel):
    title: str
    node_type: str
    description: Optional[str] = ""
    entity_relations: Optional[List[Dict]] = []
    concept: Optional[str] = ""
    color: Optional[str] = ""
    children: List["GraphNode"] = []


class GraphNode(BaseModel):
    id: NodeId
    hidden: Optional[bool] = True
    data: GraphNodeData
    position: Position

# used to resolve the forward reference in the children field
GraphNodeData.update_forward_refs()

class GraphMetadata(BaseModel):
    curriculum: str
    title: str

class GraphMetadataResp(BaseModel):
    id: NodeId
    metadata: GraphMetadata

# RFNode 
class RFNode(BaseModel):
    id: NodeId
    data: GraphNodeData
    hidden: bool
    position: Position
    positionAbsolute: Position
    height: Optional[int] = Field(default=0)
    width: Optional[int] = Field(default=0)
    
class SaveGraphReq(BaseModel):
    title: str
    graph: RFNode

class CreateGraphRequest(BaseModel):
    title: str
    curriculum: str


# Graph get requests
class GetSubgraphTree(BaseModel):
    subgraph_id: NodeId

# Generator requests
class GenSubgraphTopicsRequest(BaseModel):
    subgraph: RFNode
    model: str
    llmInstr: str
    
class GenSubGraphTopicsResponse(BaseModel):
    subgraph: RFNode

class GenParagraphRequest(BaseModel):
    subgraph_id: NodeId
    model: str
    llmInstr: str

# TODO: should probably create a KGNode class
def rfnode_to_kgnode(node: RFNode):
    node_data = node.data
    node_data.children = [rfnode_to_kgnode(child) for child in node_data.children]
    
    return {
        "id": node.id,
        "node_data": node_data.dict()
    }
