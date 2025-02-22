import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  Grid,
  Card,
  CardContent,
  Typography,
  CardActions,
  IconButton,
  Box,
  Fab,
  Dialog,
  DialogContent,
  DialogActions,
  DialogTitle,
  DialogContentText,
  TextField,
  Button
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import AddIcon from '@mui/icons-material/Add';
import { useContext } from "use-context-selector";
import { BackendContext } from "../concept_map/provider/backendProvider";

import {handleChangeEvent} from "../common/utils";

function HomePage() {
  const navigate = useNavigate();
  
  // modify this to use an array of booleans
  // right now all cards are toggled on/off at once
  const [expanded, setExpanded] = useState(false);
  const [metadataList, setMetadataList] = useState([]);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [curriculum, setCurriculum] = useState("");
  const { backend } = useContext(BackendContext);

  const fetchMetadataList = () => {
    backend.getMetadaList()
      .then(res => setMetadataList(res.data))
      .catch(err => console.log(err));
  };

  useEffect(() => {
    fetchMetadataList();
  }, []);

  return (
    <Box>
      <Grid container spacing={3} marginRight={3} >
        {metadataList.map((item, index) => (
          <Grid item xs={4} key={index}>
            <Card sx={{
                  cursor: "pointer",
                  ':hover': {
                    boxShadow: 20, // theme.shadows[20]
                  },
                }}
              >
              <CardContent onClick={() => navigate("/tree/" + item.id)}>
                <Typography variant="h5" component="div">
                  {item.metadata.title}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Curriculum: {item.metadata.curriculum}
                </Typography>
              </CardContent>
              <CardActions disableSpacing>
                <IconButton
                  onClick={() => setExpanded(!expanded)}
                  aria-expanded={expanded}
                  aria-label="show more"
                >
                  <ExpandMoreIcon />
                </IconButton>
              </CardActions>

              {/* <button onClick={() => navigate("/tree/" + item.id)}>Edit Map</button> */}
              <button onClick={() => {
                backend.deleteGraph(item.id)
                  .then(() => {
                    setMetadataList(prevList => prevList.filter(metadata => metadata.id !== item.id));
                  })
                  .catch(err => console.log(err));
              }}>Delete</button>
            </Card>
          </Grid>
        ))}
      </Grid>
      <Fab color="primary" aria-label="add" onClick={() => setOpen(true)} 
        sx={{
         position: 'fixed', 
         bottom: 100, 
         right: 70,
        }}>
        <AddIcon />
      </Fab>
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Create Concept Map</DialogTitle>
        <DialogContent>
          <DialogContentText>
            To start generating your first concept map, write a brief description of your subject followed by the title of the first topic
          </DialogContentText>
          <TextField
            onChange={(e) => handleChangeEvent(e, setCurriculum)}
            placeholder="A history of the Conflict of the Orders in Rome..."
            autoFocus
            margin="dense"
            id="name"
            label="Topic Description"
            type="email"
            fullWidth
            variant="standard"
            multiline={true}
            minRows={3}
            sx={{
              border: '1px solid lightgrey',
              borderTop: 'none',
              borderLeft: 'none',
            }}
          />          
          <TextField
            onChange={(e) => handleChangeEvent(e, setTitle)}
            placeholder="War of the Orders"
            autoFocus
            margin="dense"
            id="name"
            label="Title"
            type="email"
            fullWidth
            variant="standard"
          />

        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={
            () => {
              backend.createGraph(curriculum, title).then(
                res => window.location.reload()
              );
            }}>Create</Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}

export default HomePage;


