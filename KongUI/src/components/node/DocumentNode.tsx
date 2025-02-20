import { Handle, Position } from 'reactflow';
import { DocumentNodeData } from "@/common/common-types";
import { DocumentViewContext } from '@/provider/DocumentViewProvider';
import { useContext } from 'use-context-selector';
import { LexicalEditor } from '@/components/LexicalEditor';
import { IoMdClose } from 'react-icons/io'; // Import the close icon

const handleStyle = { left: 10 };

type DocumentNodeProps = {
    data: DocumentNodeData;
    isConnectable: boolean;
};

function DocumentNode({ data, isConnectable }: DocumentNodeProps) {
    const { 
      deleteDocument,
    } = useContext(DocumentViewContext);
    
    const handleDeleteNode = () => {
      deleteDocument(data.id);
    };

    return (
      <div style={{ width: 600}}>
        <div onClick={handleDeleteNode} style={{ cursor: 'pointer', padding: '5px' }}>
          <IoMdClose size={20} />
        </div>      
        <div style={{ width: '100%', display: 'flex', alignItems: 'center' }}>
          <Handle type="target" position={Position.Top} isConnectable={isConnectable} />
          <LexicalEditor
              text={data.text}
          />
          <Handle
              type="source"
              position={Position.Bottom}
              id="a"
              style={handleStyle}
              isConnectable={isConnectable}
          />
        </div>
      </div>
    );
}

export default DocumentNode;
