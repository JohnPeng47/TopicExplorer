import React, { 
    memo, 
    useCallback, 
    useEffect,
    useRef,
    useState,
    useMemo
  } from "react";
import { createContext, useContext } from "use-context-selector";
import { useMemoObject } from "../../common/hooks/useMemo";
import { 
  useOnSelectionChange,
  useReactFlow, 
  Node,
  Edge
} from "reactflow";
import { TreeUtils } from "../graph/tree/treeUtils";
import { RFNodeData } from "../../common/common-types";
import {
  ChangeCounter,
  nextChangeCount,
  useChangeCounter,
  wrapRefChanges,
} from '../../common/hooks/useChangeCounter';

import { SetState } from "../../common/common-types";

import { GraphType } from "../data/processNodes";
import { BackendContext } from "./backendProvider";
import { AxiosResponse } from "axios";

interface TreeEditMap {
  downloadGraph: (graphID: string, graphType: GraphType) => void;
  genSubGraph: (nodeId: string) => Promise<AxiosResponse>;
  modifyNodeTitle: (nodeId: string, newTitle: string) => void;
  deleteNode: (nodeId: string) => void;
  saveGraph: (title: string) => void;
  genGraphDesc: (graphId: string) => Promise<AxiosResponse>;
  collapseNodes: (parentId: string, expand: boolean) => void;
  addNode: (parentId: string) => void;
  genSubgraphParagraph: (subgraphId: string) => Promise<AxiosResponse>;
  nodesWithoutDescr: number;
}

export const TreeEditMapContext = createContext<Readonly<TreeEditMap>>({} as TreeEditMap);
export const TreeEditMapProvider = memo(
({
  children,
}: React.PropsWithChildren) => {
  const [nodeChanges, addNodeChanges, nodeChangesRef] = useChangeCounter();
  const [edgeChanges, addEdgeChanges, edgeChangeRef] = useChangeCounter();

  const { backend } = useContext(BackendContext);
  const { 
    setNodes, 
    setEdges, 
    getNodes, 
    getEdges, 
  } = useReactFlow();

  let nodesWithoutDescr = useRef<number>(0);

  const graph = useRef(new TreeUtils(getNodes, getEdges)).current;
  const setNodesRef = useRef<SetState<Node<any>[]>>(setNodes);
  const setEdgeRef = useRef<SetState<Edge<any>[]>>(setEdges);

  const changeNodes = useMemo(
    () => wrapRefChanges(setNodesRef, addNodeChanges),
    [addNodeChanges]
  );
  const changeEdges = useMemo(
    () => wrapRefChanges(setEdgeRef, addEdgeChanges),
    [addEdgeChanges]
  )
  
  const downloadGraph = (graphId: string, graphType: GraphType) => {
    backend.downloadGraph(graphId)
      .then((res) => {
        // represents the order of nodes in JSON format
        let {newNodes, newEdges} = graph.initJson(res.data, graphType);
        
        changeNodes(newNodes);
        changeEdges(newEdges);
      })
      .catch(error => {
        console.error("Error fetching graph error: ", error);
        throw error;
      })
  }

  // maybe this should go into graph utils, since this generic to all nodes
  const modifyNode = useCallback(
    (id: string, mapFn: (oldNode: Node<RFNodeData>) => Node<RFNodeData>) => {
      setNodes((nodes) => {
        const newNodes: Node<RFNodeData>[] = [];
        for (const n of nodes) {
          if (n.id === id) {
            const newNode = mapFn(n);
            if (newNode === n) return nodes;
            newNodes.push(newNode);
          } else {
            newNodes.push(n);
          }
        }
        return newNodes;
      });
    },
    [setNodes]
  );
  
  // const modifyNodes = useCallback((modNodes: Node<RFNodeData>[]) => {
  //   const newNodes: Node<RFNodeData>[] = [];
  //   for (const oldNode of getNodes()) {
  //     const modify = modNodes
  //       .map(node => node.id)
  //       .includes(oldNode.id)
  //     newNodes.push(
  //       modify
  //       // double loop here not ideal but looks nicer 
  //       ? modNodes.find(node => node.id === oldNode.id)
  //       : oldNode
  //     )
  //   }
  //   return newNodes;
  // }, [getNodes])

  /**
   * Modifies the node title
   */
  const modifyNodeTitle = useCallback(
    (id: string, newTitle: string): void => {
      modifyNode(id, (old) => {
        return {
          ...old,
          data : {
            ...old.data,
            title: newTitle
          }
        }
      })
    }, [modifyNode]
  )

  /**
   * Deletes node and all its children as well as repositioning
   */
  const deleteNode = useCallback(
    (id: string): void => {
      const {newNodes, newEdges} = graph.deleteNodes(id);

      changeEdges(newEdges);
      changeNodes(newNodes);
    }, [changeNodes]
  )

  /**
   * Add blank node before current node
   */
  const addNode = useCallback(
    (currId: string): void => {
      const {newNodes, newEdges} = graph.addNode(currId);

      changeNodes(newNodes);
      changeEdges(newEdges);
  }, [changeNodes, changeEdges]);
  
  /**
   * Hides all children nodes
   */
  const collapseNodes = useCallback(
    (parentId: string, collapsed: boolean): void => {
      const {newNodes, newEdges} = graph.collapseNodes(parentId, collapsed);
      
      changeNodes(newNodes);
      changeEdges(newEdges);
  }, [changeNodes, changeEdges]);

  
  /**
   * Listen for de-selection due to generate paragraph, and re-select node
   */
  const [genParagraph, setGenParagraph] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState("");
  useOnSelectionChange({
    onChange: ({ nodes }) => {
      if (nodes.length > 1)
        throw Error("More than one node selected");

      if (nodes.length === 0 && genParagraph) {
        modifyNode(selectedNodeId, (old) => ({
            ...old,
            selected : true
          })
        );
        setGenParagraph(false);

      } else if (nodes.length === 1) {
        setSelectedNodeId(nodes[0].id);
      }
    },
  });

  /**
   * Sync backend
   */
  useEffect(() => {
    if (nodeChanges === 0) 
      return

    const rootNode = getNodes()[0];
    const updateRoot = graph.RFtoJSON(rootNode);
    backend.updateGraph(updateRoot, rootNode.id);
  }, [nodeChanges, edgeChanges])

  /**
   * Update nodes without description
   */
  useEffect(() => {
    nodesWithoutDescr.current = getNodes().filter(node => node.data.description === "").length
  }, [nodeChanges])

  /**
   * Syncs graph with updated node 
   */
  const genSubGraph = (nodeId: string): Promise<AxiosResponse> => {
    return new Promise((resolve, reject) => {
      const subgraph = graph.RFtoJSON(nodeId);
      const rootId = getNodes()[0].id;
      console.log("Subgraph: ", subgraph);
  
      backend.genSubGraph(subgraph, rootId)
        .then((res) => {
          const {
            newNodes, 
            newEdges
          } = graph.updateSubtreeJson(res.data);
  
          changeNodes(newNodes);
          changeEdges(newEdges);
          resolve(res.data);
        })
        .catch((err) => {
          console.error("Error from server: ", err);
          reject(err);
        });
    });
  };
  
  /**
   * Generate graph description
   */
  const genGraphDesc = (graphId: string): Promise<AxiosResponse> => {
    console.log("Generating graph: ", graphId);
    return backend.genGraphDesc(graphId);
  } 
  
  const genSubgraphParagraph = ( subgraphId: string ): Promise<AxiosResponse> => {
    const rootId = getNodes()[0].id;

    return new Promise((resolve, reject) => {
      backend.genSubgraphParagraph(rootId, subgraphId).then((res) => {
        const {
          newNodes, 
          newEdges
        } = graph.updateSubtreeJson(res.data);

        setGenParagraph(true);
        changeNodes(newNodes);
        changeEdges(newEdges);
        resolve(res.data);
      })
      .catch((err) => {
        console.error("Error from server: ", err);
        reject(err);
      });
    });
  }

  const saveGraph = (title: string): void => {
    const rootNode = getNodes()[0];
    console.log("Saving graph: ", rootNode);

    const updateRoot = graph.RFtoJSON(rootNode);
    backend.saveGraph(updateRoot, title);
  }

  const globalValue = useMemoObject<TreeEditMap>({
    downloadGraph,
    genSubGraph,
    deleteNode,
    modifyNodeTitle,
    saveGraph,
    genGraphDesc,
    collapseNodes,
    addNode,
    genSubgraphParagraph,
    nodesWithoutDescr: nodesWithoutDescr.current
  });
  
  return (
    <TreeEditMapContext.Provider value={globalValue}>
        {children}
    </TreeEditMapContext.Provider>
  );
}
);
