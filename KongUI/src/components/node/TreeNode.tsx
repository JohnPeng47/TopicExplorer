import { useRef, useState, useEffect } from 'react';
import { useContext } from 'use-context-selector';
import { Handle, Position } from 'reactflow';

import { RFNodeData, DocumentNode } from "@/common/common-types";
import { TextBox } from '@/components/TextBox';
import { GenParagraphDialogue } from '@/components/GenParagraphDialogue';
import { extractMarkdownLLM } from '@/common/utils';

import { TreeEditMapContext } from '@/provider/TreeEditMapProvider';
import { AlertBoxContext } from '@/common/provider/AlertBoxProvider';

// ICONS
import { RxComponentBoolean, RxBoxModel } from "react-icons/rx";

const handleStyle = { left: 10 };

type TreeNodeProps = {
    data: RFNodeData;
    isConnectable: boolean;
    selected: boolean;
    xPos: number,
    yPos: number,
    openSideMenu: (data: RFNodeData, open: boolean) => void;
  };

function TreeNode({ data, isConnectable, selected, xPos, yPos, openSideMenu}: TreeNodeProps) {
  const [collapsed, setCollapsed] = useState(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [sideMenuOpen, setSideMenuOpen] = useState(false);
  
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [reportText, setReportText] = useState('');
  // const [subgraphTreeData, setSubgraphTreeData] = useState('');

  const titleRef = useRef<string>(data.title);
  const boxWidth = 600;
  const model = "claude";
  const llmInstr = "";

  const { 
    modifyNodeTitle, 
    genSubGraph, 
    deleteNode, 
    collapseNodes,
    addNode,
    genReport,
    genSubgraphParagraph,
    onNodeClick
  } = useContext(TreeEditMapContext);
  const { sendToast } = useContext(AlertBoxContext);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    titleRef.current = event.target.value;
    modifyNodeTitle(data.id, titleRef.current);
  };

  const handleGenerateSubtopics = () => {
    setLoading(true);
    
    genSubGraph(data?.id || '', model, llmInstr)
      .then((_) => {
        sendToast("Finished generating!", "success")
      })
      .catch((err) => {
        sendToast(`Server error: ${err}`, "error")
      })
      .finally(() => {
        setLoading(false)
    })
  }

  const handleGenReport = () => {
    setLoading(true);
    sendToast("Started generating paragraph!", "success");

    genReport(data?.id || '', model, llmInstr)
      .then((res) => {
        setReportText(extractMarkdownLLM(res.data.report));
        setShowCopyModal(true);

        sendToast("Report generated successfully!", "success");
      })
      .catch((err) => {
        console.error("Error generating subgraph paragraph:", err);
        sendToast(`Error generating subgraph paragraph: ${err}`, "error");
      })
      .finally(() => {
        setLoading(false);
      });
  }

  const handleGenParagraph = () => {
    setShowCopyModal(true);
  }
  
  const handleGenerate = async (nodeId: string, model: string, llmInstr: string, includeAncestors: boolean) => {
    sendToast("Started generating paragraph!", "success");
    try {
      await genSubgraphParagraph(nodeId, model, llmInstr);      
      sendToast("Paragraph generated successfully!", "success");
    } catch (error) {
      console.error('Error generating paragraph:', error);
      sendToast(`Error generating paragraph: ${error}`, "error");
    }
  };

  const iconButtons = [
    {
      icon: () => { return <RxComponentBoolean style={{color: "green"}}/> },
      name: 'Expand Topics',
      onClick: handleGenerateSubtopics
    },
    {
      icon: RxBoxModel,
      name: 'Gen Report',
      onClick: handleGenReport
    },
    {
      icon: () => { return <RxComponentBoolean style={{color: "blue"}}/> },
      name: 'Gen Paragraph',
      onClick: handleGenParagraph
    }
  ];

  return (
    <div style={{ width: boxWidth, display: 'flex', alignItems: 'center' }}>
      <Handle type="target" position={Position.Left} isConnectable={isConnectable} />
        <div style={{ width: '80%' }}>
          <TextBox
            isLoading={loading}
            onClick={() => { 
              console.log("Clicked on node:", data.id);
              onNodeClick(data.id);
              // setSideMenuOpen(!sideMenuOpen);
              // openSideMenu(data, !sideMenuOpen);
            }}
            initValue={data.title}
            handleInputChange={handleInputChange}
            onToggleExpand={() => {
              setCollapsed(!collapsed);
              collapseNodes(data.id, !collapsed);
            }}
            onAddItem={() => addNode(data.id)}
            onRemove={() => deleteNode(data.id)}
            iconButtons={iconButtons}
          />
        </div>
        <Handle
          type="source"
          position={Position.Bottom}
          id="a"
          style={handleStyle}
          isConnectable={isConnectable}
        />
      {showCopyModal && (
        <GenParagraphDialogue 
          nodeId={data.id}
          model={model}
          onClose={() => setShowCopyModal(false)} 
          title="Generated Report"
          description=""
          handleGenerate={handleGenerate}
        />
      )}
    </div>
  );
}

export default TreeNode;
