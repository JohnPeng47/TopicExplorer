import { Node } from "reactflow"

export function getNodeElement(node: Node): HTMLElement {
	return document.querySelector(`[data-id="${node.id}"]`)
}

export const updateNode = (nodes: Node[], updateNodes: Node[]) => {
	return (nodes: Node[]) => {
		return nodes.map((nds) => {
			return updateNodes.find((node) => node.id === nds.id) ?? nds
		})
	}
}

export function generateUUID(): string {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
			const r = (Math.random() * 16) | 0;
			const v = c === 'x' ? r : (r & 0x3) | 0x8;
			return v.toString(16);
	});
}

export const noop = () => {};

export function handleChangeEvent(event, setVal): void {
	setVal(event.target.value);
} 

export function extractMarkdownLLM(response: string) {
	// Find the start and end indices of the markdown block
	const startIndex = response.indexOf('```markdown');
	const endIndex = response.lastIndexOf('```');
  
	// Check if both start and end markers are found
	if (startIndex !== -1 && endIndex !== -1 && startIndex < endIndex) {
	  // Extract the content between the markers, excluding the markers themselves
	  const markdownContent = response.slice(startIndex + 11, endIndex).trim();
	  return markdownContent;
	}
  
	// If markers are not found or in incorrect order, return the original response
	return response;
  }