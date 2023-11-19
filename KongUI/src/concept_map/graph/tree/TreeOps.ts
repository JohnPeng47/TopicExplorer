import { Node, Edge } from "reactflow";
import {
  RFNodeData,
  BackendNode,
  Position,
  NodeID,
  RFNode,
  NodeType
} from "../../../common/common-types"
import { CreateEdge } from "../../data/processTree";

export type RFState = [ 
  Node<RFNodeData>[], 
  Edge[]
]

export class RFTreeOps {
  /**
   * Purpose is to add/delete nodes with a set of simple API operations while preserving
   * order of the node positions
   */
  private nodeState: Node<RFNodeData>[];
  private edgeState: Edge[];
  
  public constructor(nodes: Node<RFNodeData>[], edges: Edge[]) {
    this.nodeState = nodes;
    this.edgeState = edges;
  }

  private addNodeInternal(
    node: Node<RFNodeData>, parentId: NodeID, rfState: RFState, childIndex: number = 0
  ): RFState {
    const [ nodes, edges ] = rfState;
    const index = nodes.findIndex(node => node.id === parentId);
    const nodeIndex = index + 1 + childIndex;

    const newEdge = CreateEdge({
      target: node.id,
      source: parentId
    })

    edges.push(newEdge);
    nodes.splice(nodeIndex, 0, node);
  
    return [ nodes, edges ] 
  }

  private deleteNodeInternal(
    deleteState: RFState,
    rfState: RFState  
  ): RFState {

    const [nodes, edges ] = rfState;
    const [deleteNodes, deleteEdges] = deleteState;
  
    return [
      nodes.filter(node => !deleteNodes.map(delNode => delNode.id).includes(node.id)), 
      edges.filter(edge => !deleteEdges.map(delEdge => delEdge.id).includes(edge.id))
    ]
  }

  public deleteNode(
    parentNode: Node<RFNodeData>,
    childStates: RFState,
  ): void {
    const [deleteNodes, deleteEdges ] = childStates;
    deleteNodes.push(parentNode);
    
    const rfState = this.deleteNodeInternal([deleteNodes, deleteEdges], [this.nodeState, this.edgeState]);
    this.setRFState(rfState);
  }


  public addNode(
    node: Node<RFNodeData>,
    parentId: NodeID,
    index: number = 0
  ): void {
    const rfState = this.addNodeInternal(node, parentId, [this.nodeState, this.edgeState], index);
    this.setRFState(rfState);
  }

  private setRFState(rfState: RFState): void {
    const [ newNodesState, newEdgesState ] = rfState;
    this.nodeState = newNodesState;
    this.edgeState = newEdgesState;
  }

  public getRFState(): RFState {
    return [
      this.nodeState, 
      this.edgeState
    ]
  }
}