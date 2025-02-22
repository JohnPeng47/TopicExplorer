import "./App.css";
import { Routes, Route, BrowserRouter } from "react-router-dom";
import ConceptMapPage from "./pages/ConceptMapPage";
import LoginPage from "./authentication/Login";
import TreeEditMapPage from "./pages/TreeEditMapPage";
import RegisterationPage from "./authentication/Register";
import SearchBarHomePage from "./pages/SearchBarHomePage";

import { ReactFlowProvider } from "reactflow";
import { BackendProvider } from "./concept_map/provider/backendProvider";
import { AlertBoxProvider } from "./common/provider/AlertBoxProvider";

import { ENDPOINT } from "./api/common";

function App() {  
  return (
    <BrowserRouter basename="/TopicExplorer">
      <BackendProvider url={ENDPOINT}>
        <ReactFlowProvider>
          <AlertBoxProvider>
            <Routes>
              <Route path="/" element={<SearchBarHomePage />} />
              <Route path="/map/:mapId" element={<ConceptMapPage />} />
              <Route path="/tree/:mapId" element={<TreeEditMapPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterationPage />} />
            </Routes>
          </AlertBoxProvider>
        </ReactFlowProvider>
      </BackendProvider>
    </BrowserRouter>
  );
}

export default App;