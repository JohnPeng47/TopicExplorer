'use client'

import { useState, useEffect } from 'react'
import { useContext as useContextReact } from 'react'
import { useContext } from 'use-context-selector'
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { TreeEditMapContext } from '@/provider/TreeEditMapProvider'
import MarkdownPreview from '@uiw/react-markdown-preview';
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { GlobalContext } from '@/provider/ParentProvider'
import { AlertBoxContext } from '@/common/provider/AlertBoxProvider'
import { extractMarkdownLLM } from '@/common/utils'

type LargeCopyModalProps = {
  nodeId: string;
  model: string;
  onClose: () => void;
  title: string;
  description: string;
  handleGenerate: (nodeId: string, model: string, llmInstr: string, includeAncestors: boolean) => Promise<void>;
};

export function GenParagraphDialogue({ nodeId, model, onClose, title, description, handleGenerate }: LargeCopyModalProps) {
  const [open, setOpen] = useState(true);
  const [llmInstr, setLlmInstr] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [includeAncestors, setIncludeAncestors] = useState(false);

  const { getSubtreeasText } = useContext(TreeEditMapContext);

  const onGenerateClick = async () => {
    setIsLoading(true);
    try {
      await handleGenerate(nodeId, model, llmInstr, includeAncestors);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      onClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <div className="flex-grow flex flex-col space-y-4">
          <DialogHeader className="flex flex-row items-center justify-between">
            <div>
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription>{description}</DialogDescription>
            </div>
          </DialogHeader>
          <div className="flex items-center space-x-2">
            <Switch
              id="include-ancestors"
              checked={includeAncestors}
              onCheckedChange={setIncludeAncestors}
            />
            <Label htmlFor="include-ancestors">Include Ancestors</Label>
          </div>
          <Textarea
            placeholder="Enter LLM instructions here..."
            value={llmInstr}
            onChange={(e) => setLlmInstr(e.target.value)}
            className="flex-grow"
          />
          <Button onClick={onGenerateClick} disabled={isLoading}>
            {isLoading ? 'Generating...' : 'Generate Text'}
          </Button>
          <ScrollArea className="flex-grow border rounded-md p-4">
            <MarkdownPreview source={getSubtreeasText(nodeId, includeAncestors)} className="p-6 bg-amber-50 rounded-lg shadow-md text-slate-800 text-sm font-sans"/>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  )
}