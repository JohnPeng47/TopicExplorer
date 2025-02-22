from pydantic import BaseModel, constr
from typing import Dict, Union

NodeId = constr()

class GeneratorArg(BaseModel):
    node_id: NodeId
    data: Dict
class GeneratorResult(BaseModel):
    node_id: NodeId
    data: Union[Dict, str]
