import axios, { AxiosResponse, AxiosRequestConfig } from "axios";
import {
  RFEdge,
  RFNodeData,
  BackendNode,
} from "./common-types";
import { Node } from "reactflow";

// import { mergeOverwite } from "./utils";

const backendCache = new Map<string, Backend>();

/**
 * Returns a cached backend instance.
 *
 * Given the same URL, this function guarantees that the same instance is returned.
 */
export const getBackend = (url: string): Backend => {
  let instance = backendCache.get(url);
  if (instance === undefined) {
    instance = new Backend(url);
    backendCache.set(url, instance);
  }
  return instance;
};

export class Backend {
  readonly url: string
  private token: string | null = null;
  private nodes: BackendNode;
  private authConf: Promise<AxiosRequestConfig>;

  constructor(url: string) {
    console.log(`Initializing Backend with URL: ${url}`);
    this.url = url;

    this.authConf = this.initAuthentication();
  }

  private async initAuthentication(): Promise<AxiosRequestConfig> {
    const token = localStorage.getItem("token");
    if (token) {
      console.log("Existing token found in localStorage");
      return this.addBearerToConf(token);
    } else {
      console.log("No existing token found, registering new user");
      try {
        const response = await this.registerUser();
        const newToken = response.data.token;
        console.log("New token received from server");
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
    const endpoint = this.url + `/gen/v2/subgraph/${graphId}`;
    const data = {
      subgraph: subgraph,
      model: model,
      llmInstr: llmInstr
    }

    return axios.post(endpoint, data, await this.authConf);
  }

  /**
   * Updates the entire graph viaootNode
   */
  async updateGraph(
    rootNode: Node<RFNodeData>,
    graphId: string): Promise<void> {
    const endpoint = this.url + "/graph/v2/update/" + graphId;

    axios.post(endpoint, rootNode, await this.authConf);
  }
  
  /**
   * Registers a new user
   */
  async registerUser(): Promise<AxiosResponse> {
    const endpoint = this.url + "/register";
    const data = {};

    return axios.post(endpoint, data, await this.authConf);
  }

  /**
   * Delete graph 
   */
  async deleteGraph(
    graphId: string): Promise<void> {
    const endpoint = this.url + "/graph/delete/" + graphId;

    axios.get(endpoint, await this.authConf);
  }

  

  /**
   * Delete graph 
   */
  async saveGraph(
    rootNode: Node<RFNodeData>,
    title: string): Promise<void> {
    const endpoint = this.url + "/graph/save"
    const data = {
      "title": title,
      "graph": rootNode
    }

    axios.post(endpoint, data, await this.authConf);
  }

  /**
   * Downloads graph from server
   */
  async downloadGraph(
    graphId: string): Promise<AxiosResponse> {
    const endpoint = this.url + "/graph/" + graphId;

    return axios.get(endpoint, await this.authConf);
  }

  /**
   * Downloads graph from server
   */
  async genGraphDesc(graphId: string): Promise<AxiosResponse> {
    const endpoint = this.url + "/graph/generate/" + graphId;

    return axios.get(endpoint, await this.authConf);
  }

  /**
   * Downloads graph from server
   */
  async login(email: string, password: string): Promise<string | Boolean> {
    const endpoint = this.url + "/authenticate";
    const data = {
      email: email,
      password: password
    }
    return new Promise<Boolean>((resolve, reject) => {
      // axios.post(endpoint, data)
      //   .then((res) => {
      //     this.authConf = this.addBearerToConf(res.data.token);
      //     localStorage.setItem("token", res.data.token);
      //     resolve(true);
      //   })
      //   .catch(err => reject(err))
    })
  }

  /**
   * Gets list of metadata
   */
  async getMetadaList(): Promise<AxiosResponse> {
    const endpoint = this.url + "/metadata";

    console.log("Metadata: ", await this.authConf);
    return axios.get(endpoint, await this.authConf);
  }
  
  /**
   * Downloads graph from server
   */
  async createGraph(curriculum: string, title: string): Promise<AxiosResponse> {
    const endpoint = this.url + "/graph/create";
    const data = {
      curriculum: curriculum,
      title: title
    }

    console.log(data);
    return axios.post(endpoint, data, await this.authConf);
  }

  /**
   * Generates subgraph paragraph
   */
  async genSubgraphParagraph(graphId: string, subgraphId: string, model: string, llmInstr: string): Promise<AxiosResponse> {
    const endpoint = this.url + "/gen/paragraph/subgraph/" + graphId;
    const data = {
      model: model,
      subgraph_id: subgraphId,
      llmInstr: llmInstr
    }

    return axios.post(endpoint, data, await this.authConf);
  }

  /**
   * Generates subgraph paragraph
   */
    async genReport(graphId: string, subgraphId: string, model: string, llmstr: string): Promise<AxiosResponse> {
      const endpoint = this.url + "/gen/report/subgraph/" + graphId;
      const data = {
        model: model,
        subgraph_id: subgraphId,
        llmInstr: llmstr
      }
  
      return axios.post(endpoint, data, await this.authConf);
    }

  /**
   * Gets the subgraph tree for a given graph ID
   */
  async getSubgraphTree(graphId: string, subgraph_id: string): Promise<AxiosResponse> {
    const endpoint = this.url + `/graph/v2/subgraph/tree/${graphId}`;
    const data = {
      subgraph_id: subgraph_id
    };

    return axios.post(endpoint, data, await this.authConf);
  }
}

