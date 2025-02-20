import { useMemoObject } from "@/common/hooks/useMemo";
import { createContext } from 'use-context-selector';
import React, { memo } from "react";

import axios, { AxiosResponse, AxiosRequestConfig, AxiosError } from "axios";
import {
  DocumentNodeList,
  DocumentNode,
  RFEdge,
  RFNodeData,
  BackendNode,
} from "@/common/common-types";
import { Node } from "reactflow";
import { text } from "stream/consumers";

const backendCache = new Map<string, Backend>();
/**
 * Returns a cached backend instance.
 *
 * Given the same URL, this function guaranteUes that the same instance is returned.
 */
export const getBackend = (url: string): Backend => {
  let instance = backendCache.get(url);
  if (instance === undefined) {
    instance = new Backend(url);
    backendCache.set(url, instance);
  }
  return instance;
};

const handleApiRequest = <T,>() => async (
  endpoint: string,
  apiCall: () => Promise<AxiosResponse<T>>
): Promise<AxiosResponse<T>> => {
  try {
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timed out')), 5000)
    );
    const response = await Promise.race([apiCall(), timeoutPromise]) as AxiosResponse<T>;
    return response;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      if (axiosError.response?.status === 404 || axiosError.response?.status === 400) {
        console.log(`Error ${axiosError.response.status} for ${endpoint}: ${axiosError.response.data}`);
      } else if (axiosError.code === 'ECONNABORTED') {
        console.log(`Request timed out for ${endpoint}`);
      }
    } else if (error instanceof Error && error.message === 'Request timed out') {
      console.log(`Request timed out for ${endpoint}`);
    }
    throw error;
  }
};

export class Backend {
  readonly url: string
  private authConf: Promise<AxiosRequestConfig>;
  private handleRequest: <T>(endpoint: string, apiCall: () => Promise<AxiosResponse<T>>) => Promise<AxiosResponse<T>>;

  constructor(url: string) {
    this.url = url;
    this.authConf = this.initAuthentication();
    this.handleRequest = handleApiRequest();
  }

  private async initAuthentication(): Promise<AxiosRequestConfig> {
    const token = localStorage.getItem("token");
    if (token) {
      return this.addBearerToConf(token);
    } else {
      try {
        const response = await this.registerUser();
        const newToken = response.data.token;
        localStorage.setItem("token", newToken);

        return this.addBearerToConf(newToken);
      } catch (error) {
        console.error("Failed to register user:", error);
        throw error;
      }
    }
  }

  /**
    * Adds Bearer token to conf
  */
  private addBearerToConf(token: string): AxiosRequestConfig {
    return {
      headers: {
        Authorization : `Bearer ${token}`
      }
    }
  }

  /**
   * Syncs with nodes state from globalProvider and pushes update to 
   * server, a single node at a time
   */
  async genSubGraph(
    subgraph: Node<RFNodeData>,
    graphId: string,
    model: string,
    llmInstr: string): Promise<AxiosResponse> {
    const endpoint = `/gen/v2/subgraph/${graphId}`;
    
    return this.handleRequest(endpoint, async () => {
      const data = {
        subgraph: subgraph,
        model: model,
        llmInstr: llmInstr
      }
      return axios.post(this.url + endpoint, data, await this.authConf);
    });
  }

  /**
   * Updates the entire graph viaootNode
   */
  async updateGraph(
    rootNode: Node<RFNodeData>,
    graphId: string): Promise<void> {
    const endpoint = `/graph/v2/update/${graphId}`;
    await this.handleRequest(endpoint, async () => {
      return axios.post(this.url + endpoint, rootNode, await this.authConf);
    });
  }
  
  /**
   * Registers a new user
   */
  async registerUser(): Promise<AxiosResponse> {
    const endpoint = "/register";
    return this.handleRequest(endpoint, async () => {
      const data = {};
      return axios.post(this.url + endpoint, data, await this.authConf);
    });
  }

  /**
   * Delete graph 
   */
  async deleteGraph(
    graphId: string): Promise<void> {
    const endpoint = `/graph/delete/${graphId}`;
    await this.handleRequest(endpoint, async () => {
      return axios.get(this.url + endpoint, await this.authConf);
    });
  }

  

  /**
   * Delete graph 
   */
  async saveGraph(
    rootNode: Node<RFNodeData>,
    title: string): Promise<void> {
    const endpoint = "/graph/save";
    await this.handleRequest(endpoint, async () => {
      const data = {
        "title": title,
        "graph": rootNode
      }

      return axios.post(this.url + endpoint, data, await this.authConf);
    });
  }

  /**
   * Downloads graph from server
   */
  async downloadGraph(
    graphId: string): Promise<AxiosResponse> {
    const endpoint = `/graph/${graphId}`;
    return this.handleRequest(endpoint, async () => {
      return axios.get(this.url + endpoint, await this.authConf);
    });
  }

  /**
   * Downloads graph from server
   */
  async genGraphDesc(graphId: string): Promise<AxiosResponse> {
    const endpoint = `/graph/generate/${graphId}`;
    return this.handleRequest(endpoint, async () => {
      return axios.get(this.url + endpoint, await this.authConf);
    });
  }

  /**
   * Gets list of metadata
   */
  async getMetadaList(): Promise<AxiosResponse> {
    const endpoint = "/metadata";
    return this.handleRequest(endpoint, async () => {
      return axios.get(this.url + endpoint, await this.authConf);
    });
  }
  
  /**
   * Downloads graph from server
   */
  async createGraph(curriculum: string, title: string): Promise<AxiosResponse> {
    const endpoint = "/graph/create";
    return this.handleRequest(endpoint, async () => {
      const data = {
        curriculum: curriculum,
        title: title
      }

      console.log(data);
      return axios.post(this.url + endpoint, data, await this.authConf);
    });
  }

  /**
   * Generates subgraph paragraph
   */
  async genSubgraphParagraph(graphId: string, subgraphId: string, model: string, llmInstr: string): Promise<AxiosResponse> {
    const endpoint = `/gen/paragraph/subgraph/${graphId}`;
    return this.handleRequest(endpoint, async () => {
      const data = {
        model: model,
        subgraph_id: subgraphId,
        llmInstr: llmInstr
      }

      return axios.post(this.url + endpoint, data, await this.authConf);
    });
  }

  /**
   * Generates subgraph paragraph
   */
    async genReport(graphId: string, subgraphId: string, model: string, llmstr: string): Promise<AxiosResponse> {
      const endpoint = `/gen/report/subgraph/${graphId}`;
      return this.handleRequest(endpoint, async () => {
        const data = {
          model: model,
          subgraph_id: subgraphId,
          llmInstr: llmstr
        }
  
        return axios.post(this.url + endpoint, data, await this.authConf);
      });
    }

  /**
   * Gets the subgraph tree for a given graph ID
   */
  async getSubgraphTree(graphId: string, subgraph_id: string): Promise<AxiosResponse> {
    const endpoint = `/graph/v2/subgraph/tree/${graphId}`;
    return this.handleRequest(endpoint, async () => {
      const data = {
        subgraph_id: subgraph_id
      };

      return axios.post(this.url + endpoint, data, await this.authConf);
    });
  }

  //// Document API: /////
  /**
   * Gets all documents for a given graph ID
   */
  async getDocuments(graphId: string): Promise<AxiosResponse<DocumentNodeList>> {
    const endpoint = `/documents/${graphId}`;
    return this.handleRequest(endpoint, async () => {
      return axios.get(this.url + endpoint, await this.authConf);
    });
  }

  /**
   * Adds a new document to a graph
   */
  async addDocument(graphId: string, document: DocumentNode): Promise<AxiosResponse<DocumentNode>> {
    const endpoint = `/documents/${graphId}/add`;
    return this.handleRequest(endpoint, async () => {
      const documentPayload = {
        ...document,
        data: {
          text: document.data.text,
          id: document.data.id,
          subgraph_id: document.data.subgraphId,
        }
      }
      return axios.post(this.url + endpoint, documentPayload, await this.authConf);
    });
  }

  /**
   * Deletes a document from a graph
   */
  async deleteDocument(graphId: string, nodeId: string): Promise<AxiosResponse> {
    const endpoint = `/documents/${graphId}/${nodeId}`;
    return this.handleRequest(endpoint, async () => {
      return axios.delete(this.url + endpoint, await this.authConf);
    });
  }
}

interface BackendContext {
	backend: Backend
}

interface BackendProviderProps {
	url: string
}

export const BackendContext = createContext<Readonly<BackendContext>>(
	{} as BackendContext
);

export const BackendProvider = memo(({url, children}: React.PropsWithChildren<BackendProviderProps>) => {
	const backend = getBackend(url);

  // TODO: add a different API object for Document vs. Graph
	const value = useMemoObject<BackendContext>({
		backend
	});

	return (
		<BackendContext.Provider value={value}>{children}</BackendContext.Provider>
	);
})