import React from "react";
import DocumentViewPage from "./DocumentViewPage";
import SplitScreenContainer from "@/components/SplitScreenContainer";
import TreeEditMapPage from "./TreeEditMapPage";
import { ParentProvider } from "@/provider/ParentProvider";
import { SplitScreenProvider } from "@/provider/SplitScreenProvider";

export const ParentEditPageContent: React.FC = () => {
  return (
    <SplitScreenProvider>
      <SplitScreenContainer 
        LeftComponent={TreeEditMapPage}
        RightComponent={DocumentViewPage}
      />
    </SplitScreenProvider>
  );
};

export default function ParentEditPage() {
  return (
    <ParentEditPageContent />
  );
}
