import React, {
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
  useMemo
} from "react";

import { useContext as useContextReact } from "react";
import { createContext, useContext } from "use-context-selector";

import { useMemoObject } from "@/common/hooks/useMemo";
import { RFNodeData, NodeType, DocumentNode } from "@/common/common-types";
import {
  ChangeCounter,
  nextChangeCount,
  useChangeCounter,
  wrapRefChanges,
} from '@/common/hooks/useChangeCounter';
import { SetState, NodeDataPosition } from "@/common/common-types";

import { CreateNode, CreateEdge } from "@/concept_map/data/processTree";
import {
  useOnSelectionChange,
  useReactFlow,
  Node,
  Edge,
} from "reactflow";
import { TreeUtils } from "@/concept_map/graph/tree/treeUtils";
import { BackendContext } from "@/network/BackendProvider";
import { GlobalContext } from "@/provider/ParentProvider";

import { AxiosResponse } from "axios";
import { Position } from "@/common/common-types";

function initNodePos(depth: number, nodeIndex: number): Position {
  const INIT_X_INTERVAL = 50;
  const INIT_Y_INTERVAL = 70;

  const position = {
    x: INIT_X_INTERVAL * depth,
    y: INIT_Y_INTERVAL * nodeIndex
  }
  return position;
}

export type TreeEditMapI = {
  initGraph: (nodes: Node<NodeDataPosition>[], edges: Edge[]) => void;
  modifyNodeTitle: (nodeId: string, newTitle: string) => void;
  modifyNodeDescr: (nodeId: string, newDescr: string) => void;
  deleteNode: (nodeId: string) => void;
  saveGraph: (title: string) => void;
  genGraphDesc: (graphId: string) => Promise<AxiosResponse>;
  collapseNodes: (parentId: string, expand: boolean) => void;
  addNode: (parentId: string) => void;
  genSubgraphParagraph: (subgraphId: string, model: string, llmInstr: string) => Promise<AxiosResponse>;
  genSubGraph: (nodeId: string, model: string, llmInstr: string) => Promise<AxiosResponse>;
  displayDescriptionNodes: () => void;
  restoreNodes: () => void;
  nodesWithoutDescr: number;
  getSubgraphTree: (nodeId: string) => Promise<AxiosResponse>;
  getSubtreeasText: (nodeId: string, includeAncestors: boolean) => string;
  genReport: (subgraphId: string, model: string, llmstr: string) => Promise<AxiosResponse>;
  getRootId: () => string;
  onNodeClick: (nodeId: string) => void;
}

export const TreeEditMapContext = createContext<Readonly<TreeEditMapI>>({} as TreeEditMapI);
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

    const nodesWithoutDescr = useRef<number>(0);
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
    const { globalState, setGlobalState } = useContextReact(GlobalContext) || {};    
    const { deleteDocument = () => {}, addDocument = () => {}, moveCameraToNode = () => {} } = globalState?.DocumentViewMapI || {};
    
    // important: initializes the state of treeprovider
    const initGraph = (nodes: Node<NodeDataPosition>[], edges: Edge[]) => {
      console.log("Initializing graph with nodes: ", nodes.length);
      nodes.forEach(node => {
        node.position = initNodePos(node.data.depth, node.data.nodeIndex);
      })

      // LEARN: figure out why this triggers endless re-renders
      // changeNodes(nodes);
      // changeEdges(edges);
      setNodes(nodes);
      setEdges(edges);
    }

    // returns the subtree as an ascii tree
    const getSubtreeasText = (nodeId: string, includeAncestors: boolean): string => {
      return graph.getSubtreeasText(nodeId, includeAncestors);
    }

    const onNodeClick = useCallback(
      (nodeId: string) => {
        console.log("Clicked on node CALLBACK: ", nodeId);
        console.log(globalState.treeToDocument);
        const docId = globalState.treeToDocument[nodeId];
        moveCameraToNode(docId);
      },
    [])

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
            data: {
              ...old.data,
              title: newTitle
            }
          }
        })
      }, [modifyNode]
    )

    /**
     * Modifies the node description
     */
    const modifyNodeDescr = useCallback(
      (id: string, newTitle: string): void => {
        modifyNode(id, (old) => {
          return {
            ...old,
            data: {
              ...old.data,
              description: newTitle
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
        // loop through children to delete all attached DocumentNodes
        const nodesToCheck = [...graph.getAllChildren(id).childNodes.map(node => node.id), id];
        for (const nodeId of nodesToCheck) {
          deleteDocument(nodeId);
        }

        graph.deleteNode(id);
        const [newNodes, newEdges] = graph.getRFState();

        changeEdges(newEdges);
        changeNodes(newNodes);
      }, [changeNodes, globalState.treeToDocument]
    )

    /**
     * Add node as the first child of parent
     */
    const addNode = useCallback(
      (parentId: string): void => {
        const newNode = CreateNode({
          data: {
            title: "",
            node_type: NodeType.TreeNode,
          },
          type: NodeType.TreeNode,
          hidden: false
        });

        graph.addNode(newNode, parentId);
        const [newNodes, newEdges] = graph.getRFState();

        changeNodes(newNodes);
        changeEdges(newEdges);
      }, [changeNodes, changeEdges]);


    const [savedNodes, setSaveNodes] = useState<Node<RFNodeData>[]>([]);
    const [savedEdges, setSaveEdges] = useState<Edge<RFNodeData>[]>([]);
    /**
     * Show only node types that match the filter
     */
    const displayDescriptionNodes = useCallback(
      (): void => {
        setSaveNodes(getNodes());
        setSaveEdges(getEdges());
        
        const rootNode = getNodes()[0];
        const pgNodes = getNodes()
          .filter(node => node.data.description)
          .map(node => ({
            ...node,
            type: NodeType.TextContentNode
          }))

        graph.deleteNode(rootNode.id);
        graph.addNode(rootNode, null, 0);
        // add rootNode as parent for now
        for(const [index, node] of pgNodes.entries()) {
          graph.addNode(node, rootNode.id, index);
        }

        const [newNodes, newEdges] = graph.getRFState();
        setNodes(newNodes);
        setEdges(newEdges);
      }, [setNodes, setEdges]);

    /**
     * Show only node types that match the filter
     */
    const restoreNodes = useCallback((): void => {
      setNodes(savedNodes);
      setEdges(savedEdges);
      setSaveNodes([]);
      setSaveEdges([]);
    }, [setNodes, setEdges, savedNodes])

    /**
     * Hides all children nodes
     */
    // const collapseNodes = useCallback(
    //   (parentId: string, collapsed: boolean): void => {
    //     if (!collapsed) {
    //       const { childNodes, childEdges } = graph.getAllChildren(parentId);
    //       graph.saveHiddenNodes(parentId, childNodes, childEdges);
    //       for (let child of childNodes) {
    //         graph.deleteNode(child.id);
    //       }
    //     } else {
    //       const { savedNodes, savedEdges } = graph.getHiddendNodes(parentId)
    //       // for(let n of savedNodes) {
    //       //   console.log("Adding node: ", n.data.title);
    //       // }
    //       let seen_nodes = 0;
    //       let curr_children = 0;
    //       let lastParentId = parentId;
    //       // keeps track of which child index the parent has finished adding
    //       // let parentChildIndex = [{ id: parentId, index: 0 }];
    //       for (let [index, child] of savedNodes.entries()) {
    //         let currParentId = savedEdges.find(edge => edge.target === child.id).source;
    //         if (currParentId !== lastParentId) {
    //           seen_nodes += curr_children;
    //           curr_children = 0;
    //           lastParentId = currParentId;
    //         }
    //         // console.log("Adding node: ", child.data.title);
    //         graph.addNode(child, currParentId, index - seen_nodes);
    //         curr_children += 1;
    //       }
    //     }

    //     const [newNodes, newEdges] = graph.getRFState();

    //     setNodes(newNodes);
    //     setEdges(newEdges);
    //   }, [setNodes, setEdges]);

    const collapseNodes = useCallback(
      (parentId: string, collapsed: boolean): void => {
        if (!collapsed) {
          const { childNodes, childEdges } = graph.getAllChildren(parentId);
          graph.saveHiddenNodes(parentId, childNodes, childEdges);
          for (const child of childNodes) {
            graph.deleteNode(child.id);
          }
        } else {
          const { savedNodes, savedEdges } = graph.getHiddendNodes(parentId)
          const parentChildren = {};
          // index relative to first child of parent
          for (const child of savedNodes) {
            const currParentId = savedEdges.find(edge => edge.target === child.id).source;
            const siblings = parentChildren[currParentId];
            let childIndex = 0;

            if (!siblings) {
              parentChildren[currParentId] = [child.id];
            } else {
              childIndex += siblings.length;
              for (const child of siblings) {
                const { childNodes } = graph.allChildren(child);
                
                childIndex += childNodes.length;
              } 
            }
            // need to add to this the number of children of nodes that came before it
            // TODO: can we track current parentIndex in addNode
            graph.addNode(child, currParentId, childIndex);
          }
          console.log("Parent child index: ", parentChildren);
        }

        const [newNodes, newEdges] = graph.getRFState();
        console.log("NewNodes: ", newNodes.map(node => node.data.title));

        setNodes(newNodes);
        setEdges(newEdges);
      }, [setNodes, setEdges]);

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
            selected: true
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
    const genSubGraph = (nodeId: string, model: string, llmInstr: string): Promise<AxiosResponse> => {
      return new Promise((resolve, reject) => {
        const subgraph = graph.RFtoJSON(nodeId);
        const rootId = getNodes()[0].id;

        backend.genSubGraph(subgraph, rootId, model, llmInstr)
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

    const genSubgraphParagraph = (subgraphId: string, model: string, llmInstr: string): Promise<AxiosResponse> => {
      const rootId = getNodes()[0].id;
      
      return new Promise((resolve, reject) => {
        backend.genSubgraphParagraph(rootId, subgraphId, model, llmInstr)
          .then((res) => {
            let insertIndex = 0;
            const newDocTreeIndex = getNodes().findIndex(node => node.id === subgraphId);
            
            // want to insert the doc in the same order as its mapped subgraph/tree node            
            Object.keys(globalState.treeToDocument).forEach((treeNodeId, docIndex) => {
              const treeIndex = getNodes().findIndex(node => node.id === treeNodeId);
              if (treeIndex > newDocTreeIndex) {
                insertIndex = docIndex;
                return;
              }
            });
            
            addDocument([[res.data.paragraph, subgraphId]], true, insertIndex);
            resolve(res);
          })
          .catch((err) => {
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

    const getSubgraphTree = (nodeId: string): Promise<AxiosResponse> => {
      return new Promise((resolve, reject) => {
        const subgraph = graph.RFtoJSON(nodeId);
        const rootId = getNodes()[0].id;

        backend.getSubgraphTree(rootId, subgraph.id)
          .then((res) => {
            resolve(res);
          })
          .catch((err) => {
            console.error("Error fetching subgraph tree: ", err);
            reject(err);
          });
      });
    };

    const genReport = (subgraphId: string, model: string, llmstr: string): Promise<AxiosResponse> => {
      const rootId = getNodes()[0].id;

      return backend.genReport(rootId, subgraphId, model, llmstr);
    }

    const getRootId = useCallback((): string => {
      const nodes = getNodes();
      return nodes.length > 0 ? nodes[0].id : '';
    }, [getNodes]);

    const ctxtValue = useMemoObject<TreeEditMapI>({
      initGraph,
      modifyNodeTitle,
      modifyNodeDescr,
      deleteNode,
      saveGraph,
      genGraphDesc,
      collapseNodes,
      addNode,
      genSubgraphParagraph,
      displayDescriptionNodes,
      restoreNodes,
      nodesWithoutDescr: nodesWithoutDescr.current,
      getSubgraphTree,
      genReport,
      genSubGraph,
      getSubtreeasText,
      getRootId,
      onNodeClick
    });

    // Add ctxtValue to the Global
    useEffect(() => {
      setGlobalState(prevState => ({
        ...prevState,
        treeEditContext: ctxtValue
      }));
    }, [])

    return (
      <TreeEditMapContext.Provider value={ctxtValue}>
        {children}
      </TreeEditMapContext.Provider>
    );
  }
);
