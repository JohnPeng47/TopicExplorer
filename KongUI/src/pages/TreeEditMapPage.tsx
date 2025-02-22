import { useCallback, useEffect, useState, useMemo } from "react";
import { useContext } from "use-context-selector";
import ReactFlow, {
    applyNodeChanges,
    applyEdgeChanges,
    ReactFlowProvider,
    useNodesState,
    useEdgesState
} from "reactflow";
import { useParams } from "react-router-dom";
import TreeNode from "../concept_map/components/node/TreeNode";
import TextContentNode from "../concept_map/components/node/TextContentNode";
import { Fab } from "@mui/material";
import QuizIcon from "@mui/icons-material/Add";
import { TreeEditMapContext, TreeEditMapProvider } from "../concept_map/provider/TreeEditMapProvider";
import { RFNodeData } from "../common/common-types";
import { createElement } from 'react';
import { addPropsToRFNode } from "../concept_map/utils/types";

import {SideMenu} from "@/components/SideMenu";


function TreeEditMapPage() {
  const [ initialized, setInitialized ] = useState(false);
  const [ sideMenuOpen, setSideMenuOpen ] = useState(false);
  const [ sideMenuData, setSideMenuData ] = useState<RFNodeData | null>(null);
  const [ displayPgNodes, setdisplayPgNodes ] = useState(false);

  const { mapId } = useParams();

  const [nodes, setNodes] = useNodesState([]);
  const [edges, setEdges] = useEdgesState([]);
  const { 
    downloadGraph,
    displayDescriptionNodes,
    restoreNodes
  } = useContext(TreeEditMapContext);

  if (!initialized) {
    downloadGraph(mapId, "Tree");
    setInitialized(true);
  }

  const onNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );
  const onEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const openSideMenu = (data: RFNodeData, open: boolean) => {
    console.log("Opening side menu with data: ", data);
    setSideMenuData(data);
    setSideMenuOpen(open);
  };

  const nodeTypeWithSideMenu = useMemo(
    () => ({
        treeNode: addPropsToRFNode(TreeNode, {  openSideMenu: openSideMenu }),
        textContentNode: TextContentNode
    }), [] 
  );

  return (
    <div style={{ height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        edges={edges}
        nodeTypes={nodeTypeWithSideMenu}
        deleteKeyCode={null}
        zoomOnDoubleClick={null}
        // disable dragging
        nodesDraggable={false}
      >
      </ReactFlow>
      <SideMenu
        data={sideMenuData}
        isOpen={sideMenuOpen} 
        setIsOpen={setSideMenuOpen}>
      </SideMenu>

      
    </div>
  );
}
  
export default function () {
  return (
    <TreeEditMapProvider>
      <TreeEditMapPage />
    </TreeEditMapProvider>
  );
}