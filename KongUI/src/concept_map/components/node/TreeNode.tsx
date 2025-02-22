import { useRef, useState, useEffect } from 'react';
import { Handle, Position } from 'reactflow';
import { Box } from '@mui/material';

import { RFNodeData } from "@/common/common-types";
import { TreeEditMapContext } from '@/concept_map/provider/TreeEditMapProvider';
import '@/index.css'
import { AlertBoxContext } from '@/common/provider/AlertBoxProvider';
import { useContext } from 'use-context-selector';

import { TextBox } from '@/components/TextBox';
import { CopyModal } from '@/components/ModalWCopy';
import { LargeModalWCopy} from '@/components/LargeModalWCopy';
import { extractMarkdownLLM } from '@/common/utils';

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
    genReport
  } = useContext(TreeEditMapContext);

  const { sendToast } = useContext(AlertBoxContext);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    titleRef.current = event.target.value;
    modifyNodeTitle(data.id, titleRef.current);
  };

  const handleGenerateSubtopics = () => {
    setLoading(true);
    console.log("Generating topics with: ", llmInstr)
    
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
        console.log("Subgraph paragraph generated:", res.data);
        setReportText(extractMarkdownLLM(res.data.report));
        setShowCopyModal(true);

        sendToast("Subgraph report generated successfully!", "success");
      })
      .catch((err) => {
        console.error("Error generating subgraph paragraph:", err);
        sendToast(`Error generating subgraph paragraph: ${err}`, "error");
      })
      .finally(() => {
        setLoading(false);
      });
  }

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
    }
  ];

  return (
    <div style={{ width: boxWidth, display: 'flex', alignItems: 'center' }}>
      <Handle type="target" position={Position.Left} isConnectable={isConnectable} />
        <Box sx={{
          display: 'flex', // Horizontal layout
          flexDirection: 'row',
          width: '100%', // Take full width of the parent container
        }}>
          <TextBox
            isLoading={loading}
            onClick={() => { 
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
        </Box>
        <Handle
          type="source"
          position={Position.Bottom}
          id="a"
          style={handleStyle}
          isConnectable={isConnectable}
        />
      {showCopyModal && (
        <LargeModalWCopy 
          generatedText={reportText} 
          onClose={() => setShowCopyModal(false)} 
          title="Generated Report"
          description=""
        />
      )}
    </div>
  );
}

export default TreeNode;
