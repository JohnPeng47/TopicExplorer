import React, { useCallback, useEffect, useState } from 'react';
import { useContext } from 'use-context-selector';
import { useContext as useContextReact } from "react";
import ReactFlow, {
  Node, 
  Edge,
  ReactFlowProvider,
  applyNodeChanges,
  applyEdgeChanges,
  useNodesState,
  useEdgesState,
} from "reactflow";
import { DocumentViewProvider, DocumentViewContext } from "@/provider/DocumentViewProvider";
import DocumentNode from '@/components/node/DocumentNode';
import { useParams } from "react-router-dom";
import { BackendContext } from "@/network/BackendProvider";

const nodeTypes = {
  documentNode: DocumentNode,
};

function DocumentViewPageContent() {  
  const [isLoading, setIsLoading] = useState(true);
  const [nodes, setNodes] = useNodesState([]);
  const [edges, setEdges] = useEdgesState([]);
  const { mapId } = useParams();
  const { backend } = useContext(BackendContext);
  const { initGraph } = useContext(DocumentViewContext);

  useEffect(() => {
    const fetchDocuments = async () => {
      const documentsRes = await backend.getDocuments(mapId);
      const docsData = documentsRes.data.documents.map((doc) => ({
        ...doc,
        data: {
          //@ts-ignore ..
          subgraphId: doc.data.subgraph_id,
          text: doc.data.text,
          id: doc.data.id,
        },
        position: { x: 0, y: 0 },
      }));
      
      setNodes(docsData);
      setEdges([]);
      initGraph(docsData, []);
      setIsLoading(false);
    };
    fetchDocuments();
  }, [mapId]);

  const onNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );
  const onEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  return (
    <div style={{ height: '100vh' }}>
      <ReactFlow
        nodes={nodes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        edges={edges}
        nodeTypes={nodeTypes}
        deleteKeyCode={null}
        zoomOnDoubleClick={null}
        nodesDraggable={false}
      >
      </ReactFlow>
    </div>
  );
}

const DocumentViewComponent = () => {
  return (
    <ReactFlowProvider>
      <DocumentViewProvider>
        <DocumentViewPageContent />
      </DocumentViewProvider>
    </ReactFlowProvider>
  );
};

export default DocumentViewComponent;
