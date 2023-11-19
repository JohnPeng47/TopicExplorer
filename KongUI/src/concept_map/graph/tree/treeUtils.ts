import { Node, Edge } from "reactflow";
import {
  RFNodeData,
  BackendNode,
  Position,
  NodeID,
  RFNode,
  NodeType
} from "../../../common/common-types"
import {
  GraphType,
  ConvertNode,
  ConvertEdge
} from "../../data/processNodes";
import { CreateNode, CreateEdge } from "../../data/processTree";
import { NumberLiteralType } from "typescript";
import { RFTreeOps, RFState } from "./TreeOps";

type DFSNode = {
  node: BackendNode | Node<RFNodeData>
  depth: number
  nodeIndex: number
  parentId: NodeID
}
type NumChildren = number;

/**
 * Utility functions for read-only graph level functions
 * Does not support modification of RF node state
 */
export class TreeUtils {
  private getNodes: () => Node<any>[];
  private getEdges: () => Edge<any>[];
  private currentTreeOp: RFTreeOps | null;

  private X_INTERVAL = 50;
  private Y_INTERVAL = 70;

  // Is this consistent with RF getNodes()??
  private nodeDepth: { [NodeID: NodeID]: number };

  private savedCollapsedNodes: {
    [parentID: NodeID]: {
      savedNodes: Node<RFNodeData>[],
      savedEdges: Edge[]
    }
  };

  public constructor(
    getNodes: () => Node<any>[],
    getEdges: () => Edge<any>[]) {

    this.getNodes = getNodes;
    this.getEdges = getEdges;
    this.nodeDepth = {};
    this.savedCollapsedNodes = {};

    this.currentTreeOp = null;
  }

  /**
   * DFS implementation
   */
  private DFS(root: any): DFSNode[] {
    let nodeIndex = this.getNodeIndex(root.id);

    let traversalOrder: DFSNode[] = [];
    let stack = [[root, 0, root.id]]; // Assuming root is the starting node, at depth 0 with no parent.

    while (stack.length > 0) {
      const [currNode, depth, parentId] = stack.pop();

      // Add the current node to the traversal order
      traversalOrder.push({
        node: currNode,
        depth: depth,
        parentId: parentId,
        nodeIndex: nodeIndex
      });

      // Assuming that children are stored in currNode.data.children
      this.children(currNode).forEach((child) => {
        stack.push([child, depth + 1, currNode.id]);
      });
    }

    return traversalOrder;
  }

  /**
   * Initializes RFNodes attr such as positions from
   * initial server JSON and keeps track of position and depth
   */
  public initJson = (
    json: BackendNode,
    graphType: GraphType
  ): {
    newNodes: Node<RFNodeData>[];
    newEdges: any[]
  } => {
    const newNodes = [];
    const newEdges = [];
    let [depth, rootId, nodeIndex] = [0, json.id, 0];

    const stack: Array<[BackendNode, number, string]> = [[json, depth, rootId]];

    // return empty nodes and edges
    if (!json) {
      return { newNodes, newEdges };
    }

    while (stack.length > 0) {
      const [currNode, depth, parentId] = stack.pop();
      const rfNode = ConvertNode(currNode, graphType);
      const rfEdge = ConvertEdge(currNode, parentId, graphType);

      // determine initial node position
      const position = this.nodePosInit(depth, nodeIndex);
      rfNode.position = position;

      //node has not been seen by us before
      newNodes.push(rfNode);

      // save node positions/depths/order
      this.updateNodeState(currNode.id, depth, nodeIndex);

      // all nodes not root
      if (parentId !== currNode.id)
        newEdges.push(rfEdge);

      this.children(currNode).forEach((child) => {
        stack.push([child, depth + 1, currNode.id]);
      })

      nodeIndex += 1;
    }

    return { newNodes, newEdges };
  };

  public updateSubtreeJson = (
    serverNode: BackendNode,
  ): {
    newNodes: Node<RFNodeData>[];
    newEdges: any[];
  } => {
    // this effectively removes the children so that we can add them back in
    // via the updated subgraph
    const { childNodes } = this.getAllChildren(serverNode.id);
    const {
      beforeNodes,
      beforeEdges,
      afterNodes,
      afterEdges
    } = this.getNodesBeforeAfter(serverNode.id, childNodes.length);

    // console.log("server node: ", serverNode);

    const stack: Array<[BackendNode, number, string]> = [
      [serverNode, this.getNodeDepth(serverNode.id), this.parent(serverNode.id).id]
    ];
    const updatedSubtreeNodes = [];
    const updatedSubtreeEdges = [];

    // convert the server nodes into array
    while (stack.length > 0) {
      const [currNode, depth, parentId] = stack.pop();

      const rfNode = ConvertNode(currNode, "Tree");
      rfNode.position.x = this.X_INTERVAL * depth;
      const rfEdge = ConvertEdge(currNode, parentId, "Tree");

      updatedSubtreeNodes.push(rfNode);
      // all nodes not root
      if (currNode.id !== this.root().id)
        updatedSubtreeEdges.push(rfEdge);

      this.children(currNode).forEach((child) => {
        stack.push([child, depth + 1, currNode.id]);
      })
    }

    // console.log("After nodes: ", afterNodes.map(n => n.data.title));
    // console.log("Updated nodes: ", updatedSubtreeNodes.map(n => n.data.description));

    const newNodes = beforeNodes
      // error here due to getNodes before after being 0
      // 
      .concat(updatedSubtreeNodes)
      .concat(afterNodes)
      .map((node, index) => ({
        ...node,
        position: {
          x: node.position.x,
          y: index * this.Y_INTERVAL
        }
      }))

    const newEdges = beforeEdges
      .concat(updatedSubtreeEdges)
      .concat(afterEdges)

    return {
      newNodes,
      newEdges
    }
  }

  /**
   * Finds the new nodes being added recursively
   */
  private numNewNodes(newNode: BackendNode): number {
    let newNodes = 0;
    for (let dfs of this.DFS(newNode)) {
      if (!this.getNode(dfs.node.id))
        newNodes += 1;
    }

    return newNodes;
  }

  /**
   * Delete node and their children
   */
  public deleteNodes(id: string): {
    newNodes: Node<RFNodeData>[],
    newEdges: Edge[]
  } {
    const node = this.getNode(id);
    const { childNodes: children } = this.getAllChildren(id);
    const deleteNodes = [children, node].flat();
    const newNodes = this.getNodes()
      .filter((node) =>
        !deleteNodes
          .map(node => node.id)
          .includes(node.id)
      )
      .map((node, index) => {
        return {
          ...node,
          position: {
            x: node.position.x,
            y: index * 70
          }
        }
      })

    const newEdges = this.getEdges()
      .filter((edge) =>
        !deleteNodes
          .map(node => node.id)
          .includes(edge.target)
      )

    return {
      newNodes,
      newEdges
    }
  }

  // REIMPLEMENTATION USING NEW PASS THROUGH METHOD
  /**
   * Primitive operation adds node as the first child to parent
   * TODO: we should actually be careful since any regular operations 
   * s.t. getAllChildren can only be called before a TreeOp transaction, since
   * it does not have access to the internal TreeOp state
   * 
   * Solution is to have all read operations first check if there is currentOp
   * if true, then read from op.state
   * if not, then read from getNodes()
   * 
   * So only mutating ops will trigger a new treeOp to be created
   */
  //////////////////////////////////////////////////////////////////////
  public addNode(
    node: Node<RFNodeData>,
    parentId: NodeID
  ): void {
    if (!this.currentTreeOp)
      this.currentTreeOp = new RFTreeOps(this.getNodes(), this.getEdges());

    this.currentTreeOp.addNode(node, parentId);
  }

  public deleteNode(
    parentID: NodeID,
  ): void {

    const { childNodes, childEdges } = this.getAllChildren(parentID);
    const parentNode = this.getNode(parentID);

    if (!this.currentTreeOp)
      this.currentTreeOp = new RFTreeOps(this.getNodes(), this.getEdges());

    this.currentTreeOp.deleteNode(parentNode, [childNodes, childEdges])
  }

  public getRFState(): RFState {
    const [nodes, edges] = this.currentTreeOp.getRFState();
    const repoNodes = this.positionNodes(nodes, edges);

    // reset state of current treeOp
    this.currentTreeOp = null;

    return [repoNodes, edges];
  }

  public positionNodes(
    nodes: Node<RFNodeData>[],
    edges: Edge[]
  ): Node<RFNodeData>[] {
    return nodes.map(node => ({
      ...node,
      position: {
        x: this.getNodeDepthV2(node.id, nodes, edges) * this.X_INTERVAL,
        y: this.getNodeIndexV2(node.id, nodes) * this.Y_INTERVAL
      }
    }))
  }

  private getNodeIndexV2(
    nodeId: NodeID,
    nodes: Node<RFNodeData>[]): number {
    return nodes.findIndex(node => node.id === nodeId);
  }


  // UGLY :
  private getNodeDepthV2(
    nodeID: NodeID,
    nodes: Node<RFNodeData>[],
    edges: Edge[],
  ): number {
    let depth = 0;
    if (nodeID === this.root().id)
      return depth

    depth += 1;
    let parent = this.parentV2(nodeID, nodes, edges);
    while (parent.id !== this.root().id && depth < 100) {
      depth += 1;
      parent = this.parentV2(parent.id, nodes, edges);
    }

    return depth;
  }

  private parentV2(
    nodeId: NodeID,
    nodes: Node<RFNodeData>[],
    edges: Edge[]
  ): Node<RFNodeData> {
    const edge = edges.find(edge => edge.target === nodeId);

    // TODO: IMPORTANT => technically this could stil throw an error if 
    // our root node changes
    if (!edge && nodeId !== this.root().id) {
      throw Error("Node does not have parent, OR you are trying to replace root")
    } else if (nodeId === this.root().id) {
      return this.root();
    }

    return nodes.find(node => node.id === edge.source);
  }
  ////////////////////////////////////////////////////////////////////////////////////

  /**
   * Returns nodes and edges that came before the current node
   */
  public getNodesBeforeAfter(nodeId: NodeID, numNodes: number)
    : {
      beforeNodes: any,
      beforeEdges: any,
      afterNodes: any,
      afterEdges: any
    } {
    const nodeIndex = this.getNodeIndex(nodeId);
    // nodes that came before, not including the parent
    const beforeNodes = this.getNodes().slice(0, nodeIndex);
    const beforeEdges = this.getEdges().slice(0, nodeIndex - 1);

    // nodes that comes after the last children of the parent node
    let afterNodes = this.getNodes().slice(nodeIndex + numNodes + 1);
    let afterEdges = this.getEdges().slice(nodeIndex + numNodes + 1 - 1);

    return {
      beforeNodes,
      beforeEdges,
      afterNodes,
      afterEdges
    }
  }

  /**
   * Save collapse nodes and edges
   */
  public saveCollapsedNodes(parentId: NodeID, nodes: Node<RFNodeData>[], edges: Edge[]): void {
    this.savedCollapsedNodes[parentId] = {
      savedNodes: nodes,
      savedEdges: edges
    }
  }

  /**
   * Restore collapsed nodes and edges
   */
  public getCollapsedNodes(parentId: NodeID): {
    savedNodes: Node<RFNodeData>[],
    savedEdges: Edge[]
  } {
    const savedNodes = this.savedCollapsedNodes[parentId];
    delete this.savedCollapsedNodes[parentId];

    return savedNodes;
  }


  /**
   * Calculates the position of a node during initJson
   */
  private nodePosInit(depth: number, nodeIndex: number): Position {
    const position = {
      x: this.X_INTERVAL * depth,
      y: this.Y_INTERVAL * nodeIndex
    }
    return position;
  }

  /**
   * Updates internal node depth and node index
   * TODO: handle case when update is root node
   */
  private updateNodeState(
    nodeId: NodeID,
    depth: number,
    nodeIndex: number
  ): void {
    this.nodeDepth[nodeId] = depth;
    // this actually 
    // this.nodeIndices[nodeId] = nodeIndex;
  }

  /**
   * Find depth
   */
  public getNodeDepth(nodeId: NodeID): number {
    const rootNode = this.root();
    const traverseNodes = this.DFS(rootNode);

    // console.log(traverseNodes);
    for (let dfs of traverseNodes) {
      console.log("t node: ", dfs.node.data.title);
      if (dfs.node.id === nodeId)
        return dfs.depth
    }

    // TODO: figure out why this code below yields an error for below
    // const depth = traverseNodes
    //   .find(dfs => dfs.node.id === nodeId)?.depth;
    // if (depth)
    //   return depth;

    throw Error(`Depth for node: ${nodeId} not found`);
  }

  /**
   * Returns the current node index in vertical display
   */
  private getNodeIndex(nodeId: NodeID): number {
    return this.getNodes().findIndex(node => node.id === nodeId);
  }

  /**
   * Returns the current node depth
   */
  // private getNodeDepth(nodeId: NodeID): number {
  //   let depth = 0;
  //   while (this.parent(nodeId)) {
  //     depth += 1;
  //   }

  //   return depth;
  // }


  /**
   * Gets the immediate children
   */
  public children(node: NodeID): Node<RFNodeData>[];
  public children(node: BackendNode): BackendNode[];
  public children(node: any): any {
    // BackendNode
    if (typeof node !== "string")
      return node.data.children

    // RFNode
    const nodeId = node;
    const childIds = this.getEdges()
      .filter(edge => edge.source === nodeId)
      .map(edge => edge.target)

    return this.getNodes().filter(node => childIds.includes(node.id));
  }

  /**
   * Recursively retrieves all the child nodes
   */
  public getAllChildren(nodeId: string): {
    childNodes: Node<RFNodeData>[],
    childEdges: Edge[]
  } {
    return {
      childNodes: this.children(nodeId).flatMap(child => {
        return [child, ...this.getAllChildren(child.id).childNodes];
      }),
      childEdges: this.children(nodeId).flatMap(child => {
        return [this.findEdge(child.id), ...this.getAllChildren(child.id).childEdges]
      })
    }

  }

  /**
   * Finds and returns the edge leading to the target node
   */
  public findEdge(nodeId: string): Edge | undefined {
    return this.getEdges()
      .find((edge) => edge.target === nodeId)
  }

  /**
   * Returns node by ID using GetNodes
   * Theoretically, both method should be consistent but still
   */
  private getNode(nodeId: string): Node<RFNodeData> | undefined {
    return this.getNodes()
      .find((node) => node.id === nodeId)
  }

  /**
   * Returns the root node
   */
  public root(): Node<RFNodeData> | undefined {
    if (this.getNodes().length === 0)
      throw Error("Get nodes returned zero, no nodes in graph")

    return this.getNodes()[0]
  }

  /**
  * Returns JSON reprentation of node
  */
  public RFtoJSON(node: string): any;
  public RFtoJSON(node: Node<RFNodeData>): any;
  public RFtoJSON(node: any): any {
    if (typeof node === 'string') {
      node = this.getNode(node);
      if (!node) {
        throw Error(`Node id: {node} does not exist`)
      }
    }

    // console.log("RF NODE: ", node.data.title);
    const nodeId = node.id;
    const children = this.children(nodeId);
    node.data.children = [];

    children.forEach((child) => {
      const childNode = this.RFtoJSON(child);
      if (node) {
        node.data.children.push(childNode);
      }
    });

    return node;
  }

  /**
  * Returns siblings
  */
  public siblings(nodeId: string): Node<RFNodeData>[] {
    const parentId = this.parent(nodeId).id;

    return this.getNodes()
      .filter((node) =>
        this.getEdges()
          .filter((edge) => edge.source === parentId)
          .map((edge) => edge.target)
          .some((id) => id === node.id) && node.id !== nodeId
      )
  }

  /**
  * Returns the parent node
  */
  public parent(nodeId: string): Node<RFNodeData> {
    const edgeFromParent = this.getEdges()
      // TODO: there issue around deleting root
      .find((edge) => edge.target === nodeId);

    if (!edgeFromParent && nodeId !== this.root().id) {
      throw Error("Node does not have parent, impossible")
    } else if (nodeId === this.root().id) {
      return this.root();
    }

    return this.getNode(edgeFromParent.source);
  }
}

