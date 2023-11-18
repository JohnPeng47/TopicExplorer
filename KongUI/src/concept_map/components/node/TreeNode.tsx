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
import CloseIconOutlined from '@mui/icons-material/CloseOutlined';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import AddIcon from '@mui/icons-material/Add';

import { TreeEditMapContext } from '../../provider/TreeEditMapProvider';
import { useContext } from 'use-context-selector';
import { useNavigate } from 'react-router-dom';
import '../../../index.css'
import { AlertBoxContext } from '../../../common/provider/AlertBoxProvider';

const handleStyle = { left: 10 };

type TreeNodeProps = {
    data: RFNodeData;
    isConnectable: boolean;
    selected: boolean;
    xPos: number,
    yPos: number,
    openSideMenu: (data: RFNodeData, open: boolean) => void;
  };

const generatedNodeStyle = {
  border: "solid",
  borderWidth: 1,
  borderColor: "red"
}

function TreeNode({ data, isConnectable, selected, xPos, yPos, openSideMenu}: TreeNodeProps) {
  const [showPopup, setShowPopup] = useState(false);
  const [collapsed, setCollapsed] = useState(true);
  const [GenTopicsLoading, setGenTopicsLoading] = useState<boolean>(false);

  const [navToMap, setNavToMap] = useState(false);
  const titleRef = useRef<string>(data.title);

  const { 
    modifyNodeTitle, 
    genSubGraph, 
    deleteNode, 
    genGraphDesc,
    collapseNodes,
    addNode,
    nodesWithoutDescr
  } = useContext( TreeEditMapContext );

  const navigate = useNavigate();
  const {
    sendToast
  } = useContext( AlertBoxContext );

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    titleRef.current = event.target.value;
    modifyNodeTitle(data.id, titleRef.current);
  };

  if (selected) {
    openSideMenu(data, true);
  }

  useEffect(() => {
    if (selected) {
      openSideMenu(data, true);
    }
  }, [data, selected, openSideMenu])

    
  function GenDescrBtn(): JSX.Element { 
    return (
      <Button 
        sx={{ height: "100%", marginLeft: 1 }}
        variant="contained" 
        color="success" 
        onClick={() => {
          sendToast("Started generating graph descriptions, please wait..", "info");
          genGraphDesc(data.id).then(res => {
            sendToast("Finished updating graph!", "success");
            setNavToMap(true);
          }).catch(err => {
            sendToast("Something went wrong..", "error");
          })
        }}
      >
        Generate Graph
      </Button>
    );
  }

  function GenGraphTopicsBtn(): JSX.Element {
    return <Button sx={{
      width: 100,            // Set a specific width for the button
      marginLeft: 1            // Optional: add a little spacing between the TextField and Button
    }} variant="contained" color="primary" onClick={() =>  {
        setGenTopicsLoading(true);
        genSubGraph(data.id).then((_) => {
          sendToast("Finished generating!", "success");
          setNavToMap(false);
        }).catch((err) => {
          sendToast(`Server error: ${err}`, "success");
          // Success
        }).finally(() => {
          setGenTopicsLoading(false);
        })
      }
    }>
      Re-generate
    </Button>
  }
  
  function NavToMapBtn() { 
    return (
      <Button 
        sx={{ width: 300, marginLeft: 1 }}
        variant="contained" 
        color="secondary" 
        onClick={() => navigate(`/map/${data.id}`)}
      >
        See Updated Map
      </Button>
    );
  }
  
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
            id="text"
            name="text"
            label="Text"
            variant="outlined"
            onChange={handleInputChange}
            fullWidth
            defaultValue={data.title}
            sx={data.description ? generatedNodeStyle : {}}
                 // Allow the text field to grow as needed
          >
          </TextField>

          <Stack className="treenode-button-group" 
            sx={{
              padding: 0,
              display: selected ? "" : "none"
            }} 
            direction={"row"}>
            {
              collapsed ?
              <IconButton color="error" onClick={() =>  {
                  setCollapsed((collapsed) => !collapsed);
                  collapseNodes(data.id, !collapsed);
                }}>
                <ExpandLessIcon></ExpandLessIcon>
              </IconButton> :
              <IconButton color="success" onClick={() =>  {
                  setCollapsed((collapsed) => !collapsed);
                  collapseNodes(data.id, !collapsed);
                }}>
                <ExpandMoreIcon></ExpandMoreIcon>
              </IconButton>
            }

            <IconButton sx={{
              width: 50,            // Set a specific width for the button
              marginLeft: 1            // Optional: add a little spacing between the TextField and Button
            }} color="primary" onClick={() =>  {
                addNode(data.id);
                // setNavToMap(false);
              }
            }>
              <AddIcon></AddIcon>
            </IconButton>

            <IconButton sx={{
              width: 50,            // Set a specific width for the button
              marginLeft: 1            // Optional: add a little spacing between the TextField and Button
            }} color="error" onClick={() =>  {
                deleteNode(data.id);
              }
            }>
              <CloseIconOutlined ></CloseIconOutlined>
            </IconButton>

            <GenGraphTopicsBtn></GenGraphTopicsBtn>
          </Stack>

          {
            data.node_type === "ROOT" && (
              !navToMap ? <GenDescrBtn /> : <NavToMapBtn />
            )
          }

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

    );
  }

export default TreeNode;
  