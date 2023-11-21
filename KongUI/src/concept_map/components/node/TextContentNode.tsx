import { useRef, useState, useEffect } from 'react';
import { Handle, Position } from 'reactflow';
import { RFNodeData } from "../../../common/common-types";
import {
  Box,
  TextField,
  Button,
  CircularProgress,
  Stack,
  IconButton,
  TextareaAutosize
} from '@mui/material';

const handleStyle = { left: 10 };

type TextContentNodeProps = {
  data: RFNodeData;
  isConnectable: boolean;
  selected: boolean;
};

export default function TextContentNode({ data, isConnectable, selected }: TextContentNodeProps) {
  const [showPopup, setShowPopup] = useState(false);
  const [GenTopicsLoading, setGenTopicsLoading] = useState<boolean>(false);


  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <Handle type="target" position={Position.Left} isConnectable={isConnectable} />
      <Box sx={{
        display: 'flex', // Horizontal layout
        flexDirection: 'row',
        width: '100%', // Take full width of the parent container
      }}>
        <Box sx={{
          display: 'flex',             // Turn this box into a flex container
          alignItems: 'center',        // Align items vertically in the center
          width: 600,
          maxWidth: '100%',
          border: "black"
        }}>
          <TextField
            sx={{lineHeight: 200}}
            label={data.title}
            variant="outlined"
            multiline
            fullWidth
            defaultValue={data.description}
          >
          </TextField>
          <Box sx={{
            paddingLeft: 5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '50', // This Box will take 20% of the parent Box's width
          }}>
            {
              GenTopicsLoading &&
              <CircularProgress /> // This will be rendered when loading is true
            }
          </Box>
        </Box>
      </Box>
      {/* Cant actually remove this because RF expects it*/}
      {/* <div style={{display: "none"}}> */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="a"
        style={handleStyle}
        isConnectable={isConnectable}
      />
      {/* </div> */}
    </div>
  )
}