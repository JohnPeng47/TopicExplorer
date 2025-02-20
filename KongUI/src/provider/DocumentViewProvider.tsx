import React, { memo, useRef, useMemo, useCallback, useState, useEffect } from "react";
import { useContext as useContextReact } from "react";
import { createContext, useContext } from "use-context-selector";
import { useReactFlow, Node, Edge, getNodesBounds } from "reactflow";
import { DocumentNodeData, NodeID, SetState } from "@/common/common-types";
import { useMemoObject } from "@/common/hooks/useMemo";
import { BackendContext } from "@/network/BackendProvider";
import { generateUUID } from "@/common/utils";
import { GlobalContext } from "./ParentProvider";
import { DOCUMENT_HEIGHT } from "@/components/node/constants";
import { RFTreeOps } from "@/concept_map/graph/tree/TreeOps";
import {
  ChangeCounter,
  nextChangeCount,
  useChangeCounter,
  wrapRefChanges,
} from '@/common/hooks/useChangeCounter';
import { Rect } from '@reactflow/core';

const Y_PAD = 50;

export type DocumentViewMapI = {
  initGraph: (nodes: Node<DocumentNodeData>[], edges: Edge[]) => void;
  addDocument: (documentDataList: [DocumentNodeData | string, NodeID][], syncServer: boolean, insert_index: number) => void;
  deleteDocument: (nodeId: string) => void;
  moveCameraToNode: (nodeId: string) => void;
}

export const DocumentViewContext = createContext<Readonly<DocumentViewMapI>>({} as DocumentViewMapI);
export const DocumentViewProvider = memo(
  ({ children }: React.PropsWithChildren) => {
    const [nodeChanges, addNodeChanges, nodeChangesRef] = useChangeCounter();
    const [edgeChanges, addEdgeChanges, edgeChangeRef] = useChangeCounter();

    const { backend } = useContext(BackendContext);
    const {
      setNodes,
      setEdges,
      getNodes,
      getEdges,
      setCenter
    } = useReactFlow();
    const setNodesRef = useRef<SetState<Node<any>[]>>(setNodes);
    const setEdgeRef = useRef<SetState<Edge<any>[]>>(setEdges);

    const { globalState, setGlobalState } = useContextReact(GlobalContext);
    const { getRootId } = globalState.treeEditContext;

    const changeNodes = useMemo(
      () => wrapRefChanges(setNodesRef, addNodeChanges),
      [addNodeChanges]
    );
    const changeEdges = useMemo(
      () => wrapRefChanges(setEdgeRef, addEdgeChanges),
      [addEdgeChanges]
    );

    const initGraph = (nodes: Node<DocumentNodeData>[], edges: Edge[]) => {
      const documentDataList: [DocumentNodeData, NodeID][] = nodes.map(node => [node.data, node.data.subgraphId]);
      addDocument(documentDataList, false);
    }

    const updateNodePositions = useCallback((nodes: Node<DocumentNodeData>[]) => {
      return nodes.map((node, index) => ({
        ...node,
        position: {
          x: 0,
          y: index * (DOCUMENT_HEIGHT.px + Y_PAD)
        }
      }));
    }, []);

    const addDocument = useCallback(
      (documentDataList: [DocumentNodeData | string, NodeID][], syncServer = true, insert_index = 0): void => {
        const rootId = getRootId();
        try {
          const currNodes = getNodes();
          const newNodes = documentDataList.map(([bodyOrData, subgraphId]) => {
            let nodeData: DocumentNodeData;
            let nodeID: NodeID;

            if (typeof bodyOrData === 'string') {
              nodeID = generateUUID();
              nodeData = {
                id: nodeID,
                text: bodyOrData,
                subgraphId: subgraphId
              };
            } else {
              nodeID = bodyOrData.id;
              nodeData = bodyOrData;
            }

            return {
              id: nodeID,
              data: nodeData,
              type: "documentNode",
              position: { x: 0, y: 0 }, // Temporary position
              hidden: false
            };
          });

          let updatedNodes;
          if (insert_index === 0) {
            updatedNodes = [...currNodes, ...newNodes];
          } else {            
            updatedNodes = [
              ...currNodes.slice(0, insert_index),
              ...newNodes,
              ...currNodes.slice(insert_index)
            ];
          }

          const positionedNodes = updateNodePositions(updatedNodes);
          changeNodes(positionedNodes);
          setGlobalState(prevState => ({
            ...prevState,
            treeToDocument: {
              ...prevState.treeToDocument,
              ...Object.fromEntries(newNodes.map(node => [node.data.subgraphId, node.id]))
            }
          }));
          console.log("New data: ", Object.fromEntries(newNodes.map(node => [node.data.subgraphId, node.id])));
          console.log("Tree2doc: ", globalState.treeToDocument);
          console.log("Added documents:", newNodes.map(node => [node.data.subgraphId, node.id]));

          // update the server
          if (syncServer) {
            newNodes.forEach(node => {
              backend.addDocument(rootId, { id: node.id, data: node.data });
            });
          }

        } catch (error) {
          console.error("Error adding documents:", error);
          throw error;
        }
    }, [backend, getRootId, getNodes, nodeChanges, setGlobalState, updateNodePositions, changeNodes]);

    const deleteDocument = useCallback((nodeId: string): void => {
      const rootId = getRootId();
      try {
        const currNodes = getNodes();
        const currEdges = getEdges();
        
        const deletedNodeIndex = currNodes.findIndex(node => node.id === nodeId);
        if (deletedNodeIndex !== -1) {
          currNodes.splice(deletedNodeIndex, 1);
        }

        const updatedNodes = updateNodePositions(currNodes);
        const updatedEdges = currEdges.filter(edge => edge.source !== nodeId && edge.target !== nodeId);

        backend.deleteDocument(rootId, nodeId);
        changeNodes(updatedNodes);
        changeEdges(updatedEdges);

        setGlobalState(prevState => {
          const { [nodeId]: _, ...rest } = prevState.treeToDocument;
          return {
            ...prevState,
            treeToDocument: rest
          };
        });
      } catch (error) {
        console.error("Error deleting document:", error);
        throw error;
      }
    }, [backend, getRootId, getNodes, getEdges, changeNodes, changeEdges, setGlobalState, updateNodePositions]);

    const moveCameraToNode = useCallback((nodeId: string) => {
      console.log("Moving camera to node:", nodeId);
      const node = getNodes().find(n => n.id === nodeId);
      if (!node) {
        console.error(`Node with id ${nodeId} not found`);
        return;
      }

      const { x, y, width, height } = getNodesBounds([node]);
      const centerX = x + width / 2;
      const centerY = y + height / 2;

      setCenter(centerX, centerY, { zoom: 1, duration: 1000 });
    }, [getNodes, setCenter]);

    const ctxtValue = useMemoObject<DocumentViewMapI>({
      initGraph,
      addDocument,
      deleteDocument,
      moveCameraToNode
    });

    useEffect(() => {
      console.log("DocumentViewProvider: setting global state");
      setGlobalState((prev) => ({
        ...prev,
        DocumentViewMapI: ctxtValue
      }));
    // adding ctxtvalue to deps array triggers re-render
    }, []);

    return (
      <DocumentViewContext.Provider value={ctxtValue}>
        {children}
      </DocumentViewContext.Provider>
    );
  }
);
