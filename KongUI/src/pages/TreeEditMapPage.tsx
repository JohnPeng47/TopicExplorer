import { useCallback, useEffect, useState, useMemo } from "react";
import { useContext } from "use-context-selector";
import { useContext as useContextReact } from "react";
import ReactFlow, {
    ReactFlowProvider,
    Node,
    useNodesState,
    useEdgesState
} from "reactflow";
import { useParams } from "react-router-dom";
import { BackendContext } from "@/network/BackendProvider";
import TreeNode from "@/components/node/TreeNode";
import { RFNodeData, NodeType } from "@/common/common-types";
import { TreeEditMapProvider, TreeEditMapContext } from "@/provider/TreeEditMapProvider";
import { BackendNode } from "@/common/common-types";
import { GraphType } from "@/concept_map/data/processTree";
import { NodeDataPosition } from "@/common/common-types";
import { ConvertNode, ConvertEdge } from "@/concept_map/data/processNodes";

function initJson(
  json: BackendNode,
  graphType: GraphType
): {
  newNodes: Node<NodeDataPosition>[];
  newEdges: any[]
} {
  const newNodes = [];
  const newEdges = [];

  const depth = 0;
  const rootId = json.id;
  let nodeIndex = 0;

  const stack: Array<[BackendNode, number, string]> = [[json, depth, rootId]];

  // return empty nodes and edges
  if (!json) {
    return { newNodes, newEdges };
  }

  while (stack.length > 0) {
    const [currNode, depth, parentId] = stack.pop();
    const rfNode = ConvertNode(currNode, graphType) as Node<NodeDataPosition>;
    const rfEdge = ConvertEdge(currNode, parentId, graphType);

    rfNode.data.depth = depth;
    rfNode.data.nodeIndex = nodeIndex;

    //node has not been seen by us before
    newNodes.push(rfNode);

    // all nodes not root
    if (parentId !== currNode.id)
      newEdges.push(rfEdge);

    currNode.data.children?.forEach((child) => {
      stack.push([child, depth + 1, currNode.id]);
    })

    nodeIndex += 1;
  }

  return { newNodes, newEdges };
}

function TreeEditMapPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [sideMenuOpen, setSideMenuOpen] = useState(false);
    const [sideMenuData, setSideMenuData] = useState<RFNodeData | null>(null);
    
    const { mapId } = useParams();
    const { backend } = useContext(BackendContext);
    const { initGraph } = useContext(TreeEditMapContext);

    useEffect(() => {
      const fetchGraph = async () => {
        const treeRes = await backend.downloadGraph(mapId);
        const { newNodes, newEdges } = initJson(treeRes.data, "Tree");
        
        setNodes(newNodes);
        setEdges(newEdges);
        initGraph(newNodes, newEdges);
        setIsLoading(false);
      };
      fetchGraph();
    }, [mapId, backend, initGraph, setNodes, setEdges]);

    const openSideMenu = useCallback((data: RFNodeData, open: boolean) => {
        setSideMenuData(data);
        setSideMenuOpen(open);
    }, []);

    const nodeTypes = useMemo(() => ({
        treeNode: (props) => <TreeNode {...props} openSideMenu={openSideMenu} />,
    }), [openSideMenu]);

    return (
        <div style={{ height: '100%' }}>
            <ReactFlow
                nodes={nodes}
                onNodesChange={onNodesChange}
                edges={edges}
                onEdgesChange={onEdgesChange}
                nodeTypes={nodeTypes}
                deleteKeyCode={null}
                zoomOnDoubleClick={false}
                nodesDraggable={false}
            >
            </ReactFlow>
            {/* You can add your SideMenu component here if needed */}
        </div>
    );
}

const TreeEditMapComponent = () => {
    return (
        <ReactFlowProvider>
            <TreeEditMapProvider>
                <TreeEditMapPage />
            </TreeEditMapProvider>
        </ReactFlowProvider>
    );
};

export default TreeEditMapComponent;
