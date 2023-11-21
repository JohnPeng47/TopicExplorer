import Drawer from '@mui/material/Drawer';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import List from '@mui/material/List';
import TextField from '@mui/material/TextField';
import { IconButton, Stack } from '@mui/material';

import { RadioGroup, Radio, FormControlLabel, FormControl, FormLabel } from '@mui/material';
import { useState } from 'react';
import { AlertBoxContext } from '../../common/provider/AlertBoxProvider';
import { UseStateDispatch } from "../utils/types";
import { Node } from "reactflow";
import styled from 'styled-components';
import { RFNodeData } from '../../common/common-types';
import { TreeEditMapContext } from '../provider/TreeEditMapProvider';
import { useContext } from 'use-context-selector';
import { Button } from "@mui/material";
import { 
  CircularProgress,
  Dialog,
  DialogContent,
} from "@mui/material";
import { Box } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';


type SideMenuProps = {
  // what?
  children: React.ReactNode;
  data: RFNodeData;
  setIsOpen: UseStateDispatch<boolean>;
  isOpen: boolean;
}

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  // padding: theme.spacing(0, 1),
  // necessary for content to be below app bar
  // ...theme.mixins.toolbar,
  justifyContent: 'flex-end',
}));

export default function SideMenu(props: SideMenuProps) {
  const data: RFNodeData = props.data;

  const [model, setModel] = useState('gpt3');
  const { setIsOpen, isOpen } = props;
  const { 
    genSubgraphParagraph,
    modifyNodeDescr,
    genSubGraph
  } = useContext(TreeEditMapContext);
  const { sendToast } = useContext(AlertBoxContext);
  const [GenPgLoading, setGenPgLoading] = useState<boolean>(false);

  // dialog box control
  const [dialogOpen, setDialogOpen] = useState(false);

  function GenGraphTopicsBtn(): JSX.Element {
    const [ loading, setLoading] = useState<boolean>(false);
    return (
      <Stack direction="row">
        <Button color="primary" onClick={() =>  {
            setLoading(true);
            genSubGraph(data.id, model, "").then((_) => {
              sendToast("Finished generating!", "success");
            }).catch((err) => {
              sendToast(`Server error: ${err}`, "success");
              // Success
            }).finally(() => {
              setLoading(false);
            })
          }
        }>
          Re-generate
        </Button>
        <Box
          paddingLeft={1}
          paddingTop={1}>
          {loading && <CircularProgress size={20} />}
        </Box>
      </Stack>
    )
  }

  const SideMenuBtns = (): JSX.Element => {
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      setModel((event.target as HTMLInputElement).value);
    };
  
    return (
      <Stack direction={"column"}>
        <Box>
          <Button name="deletePg" color="error" onClick={() => {
              setDialogOpen(true);
            }}>
            Show Paragraph
          </Button>

          <Button color="primary" onClick={() => {
            setGenPgLoading(true);
            genSubgraphParagraph(data.id, model, "").then((_) => {
              console.log("Finished generating!");
              sendToast("Finished generating!", "success");
            }).catch((err) => {
              sendToast(`Server error: ${err}`, "success");
            }).finally(() => {
              setGenPgLoading(false);
            })
          }
          }>
            Generate Paragraph
          </Button>
          <Button name="deletePg" color="error" onClick={() => {
              modifyNodeDescr(data.id, "");
            }}>
            Delete Paragraph
          </Button>
        </Box>
        <GenGraphTopicsBtn></GenGraphTopicsBtn>
        <Box>
          <FormControl>
            <FormLabel id="demo-controlled-radio-buttons-group">Model</FormLabel>
            <RadioGroup
              row={true}
              aria-labelledby="demo-controlled-radio-buttons-group"
              name="controlled-radio-buttons-group"
              value={model}
              onChange={handleChange}
            >
              <FormControlLabel value="gpt3" control={<Radio />} label="gpt3" />
              <FormControlLabel value="gpt4" control={<Radio />} label="gpt4" />
            </RadioGroup>
          </FormControl>
        </Box>
        <Box
          paddingLeft={1}
          paddingTop={1}>
          {GenPgLoading && <CircularProgress size={20} />}
        </Box>
      </Stack>
    )
  }

  return (
    <div>
      <Drawer
        sx={{
          width: 300,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: 300,
            boxSizing: 'border-box',
          },
        }}
        anchor='right'
        open={props.isOpen}
        variant='persistent'
      // onClose={setIsOpen(false)}
      >
        <DrawerHeader>
          <IconButton onClick={() => setIsOpen(!isOpen)}>
            <ChevronRightIcon />
          </IconButton>
        </DrawerHeader>
        <Stack padding={1}>
          <TextField
            label="Title"
            value={props.data ? props.data.title : ""}
            multiline
          />
          <TextField
            id="standard-multiline-static"
            multiline
            color="secondary"
            rows={8}
            variant="outlined"
          />
          <SideMenuBtns></SideMenuBtns>
        </Stack>

        <Dialog open={dialogOpen} onClose={() =>{ setDialogOpen(false) }} maxWidth="md" fullWidth>
          <DialogContent>
            <IconButton onClick={() => {setDialogOpen(false) }} style={{ position: 'absolute', right: '0', top: '0' }}>
              <CloseIcon />
            </IconButton>
            <TextField
              autoFocus
              multiline
              rows={10}
              value={props.data ? props.data.description : ""}
              variant="outlined"
              fullWidth
            />
          </DialogContent>
        </Dialog>

      </Drawer>
    </div>
  );
}
