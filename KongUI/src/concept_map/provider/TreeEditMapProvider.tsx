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
  Edge,
} from "reactflow";
import { TreeUtils } from "../graph/tree/treeUtils";
import { RFNodeData, NodeType } from "../../common/common-types";
import {
  ChangeCounter,
  nextChangeCount,
  useChangeCounter,
  wrapRefChanges,
} from '../../common/hooks/useChangeCounter';

import { CreateNode, CreateEdge } from "../data/processTree";
import { SetState } from "../../common/common-types";

import { GraphType } from "../data/processNodes";
import { BackendContext } from "./backendProvider";
import { AxiosResponse } from "axios";

import { RFTreeOps } from "../graph/tree/TreeOps";

interface TreeEditMap {
  downloadGraph: (graphID: string, graphType: GraphType) => void;
  genSubGraph: (nodeId: string) => Promise<AxiosResponse>;
  modifyNodeTitle: (nodeId: string, newTitle: string) => void;
  modifyNodeDescr: (nodeId: string, newDescr: string) => void;
  deleteNode: (nodeId: string) => void;
  saveGraph: (title: string) => void;
  genGraphDesc: (graphId: string) => Promise<AxiosResponse>;
  collapseNodes: (parentId: string, expand: boolean) => void;
  addNode: (parentId: string) => void;
  genSubgraphParagraph: (subgraphId: string, model: string) => Promise<AxiosResponse>;
  displayDescriptionNodes: () => void;
  restoreNodes: () => void;
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

    console.log("Node: ", getNodes().map(node => node.type));

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
          let { newNodes, newEdges } = graph.initJson(res.data, graphType);

          console.log("Downloaded nodes: ", newNodes.map(node => node.data.node_type));
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
        graph.deleteNode(id);
        const [newNodes, newEdges] = graph.getRFState();

        changeEdges(newEdges);
        changeNodes(newNodes);
      }, [changeNodes]
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
        for(let [index, node] of pgNodes.entries()) {
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
    const collapseNodes = useCallback(
      (parentId: string, collapsed: boolean): void => {
        if (!collapsed) {
          const { childNodes, childEdges } = graph.getAllChildren(parentId);
          graph.saveHiddenNodes(parentId, childNodes, childEdges);
          for (let child of childNodes) {
            graph.deleteNode(child.id);
          }
        } else {
          const { savedNodes, savedEdges } = graph.getHiddendNodes(parentId)
          // for(let n of savedNodes) {
          //   console.log("Adding node: ", n.data.title);
          // }
          let seen_nodes = 0;
          let curr_children = 0;
          let lastParentId = parentId;
          // keeps track of which child index the parent has finished adding
          // let parentChildIndex = [{ id: parentId, index: 0 }];
          for (let [index, child] of savedNodes.entries()) {
            let currParentId = savedEdges.find(edge => edge.target === child.id).source;
            if (currParentId !== lastParentId) {
              seen_nodes += curr_children;
              curr_children = 0;
              lastParentId = currParentId;
            }
            // console.log("Adding node: ", child.data.title);
            graph.addNode(child, currParentId, index - seen_nodes);
            curr_children += 1;
          }
        }

        const [newNodes, newEdges] = graph.getRFState();

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

    const genSubgraphParagraph = (subgraphId: string, model: string): Promise<AxiosResponse> => {
      const rootId = getNodes()[0].id;

      return new Promise((resolve, reject) => {
        backend.genSubgraphParagraph(rootId, subgraphId, model).then((res) => {
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
      modifyNodeDescr,
      saveGraph,
      genGraphDesc,
      collapseNodes,
      addNode,
      genSubgraphParagraph,
      displayDescriptionNodes,
      restoreNodes,
      nodesWithoutDescr: nodesWithoutDescr.current
    });

    return (
      <TreeEditMapContext.Provider value={globalValue}>
        {children}
      </TreeEditMapContext.Provider>
    );
  }
);
