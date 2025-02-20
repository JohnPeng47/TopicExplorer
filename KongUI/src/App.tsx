import "./App.css";
import { Routes, Route } from "react-router-dom";
// import HomePage from "./pages/HomePage";
import ConceptMapPage from "./pages/ConceptMapPage";
import LoginPage from "./authentication/Login";
import RegisterationPage from "./authentication/Register";
import SearchBarHomePage from "./pages/SearchBarHomePage";

import { ReactFlowProvider } from "reactflow";
import { BackendProvider } from "@/network/BackendProvider";
import { AlertBoxProvider } from "./common/provider/AlertBoxProvider";
import ParentEditPage from "./pages/ParentEditPage";
import { ParentProvider } from "./provider/ParentProvider";

const ENDPOINT = "http://18.223.150.134:8000"

function App() {  
  return (
    <BackendProvider url={ENDPOINT}>
      <ParentProvider>
        <AlertBoxProvider>
          <Routes>
            <Route path="/" element={<SearchBarHomePage />} />
            <Route path="/tree/:mapId" element={<ParentEditPage />} />

            {/* TODO: CANT REMOVE THIS ROUTE OR RF BREAKS FOR SOME REASON */}
            <Route path="/map/:mapId" element={<ConceptMapPage />} />
            {/* <Route path="/login" element={<LoginPage />} /> */}
            <Route path="/register" element={<RegisterationPage />} />
          </Routes>
        </AlertBoxProvider>
      </ParentProvider>
    </BackendProvider>
  );
}

export default App;
