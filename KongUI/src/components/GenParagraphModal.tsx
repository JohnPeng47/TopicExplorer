'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Copy, Check } from "lucide-react"

export interface GenParagraphModalProps {
  onClose: () => void;
  actionLabel: string;
  modalAction: (text: string) => void;
}

export function CopyModal({ onClose, actionLabel, modalAction }: GenParagraphModalProps) {
  const [open, setOpen] = useState(true)
  const [llmInstr, setLlmInstr] = useState("")

  useEffect(() => {
    setOpen(true)
  }, [])

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      onClose()
    }
  }

  const handleAction = () => {
    return () => {
      modalAction(llmInstr);
    }
  }

  const handleLlmInstrChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLlmInstr(event.target.value);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Generate Text</DialogTitle>
          {/* <DialogDescription>
            {tree}
          </DialogDescription> */}
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Textarea
            placeholder="Enter LLM instructions here..."
            value={llmInstr}
            onChange={handleLlmInstrChange}
            className="min-h-[100px]"
          />
        </div>
        <DialogFooter className="sm:justify-start">
          <Button onClick={handleAction}>
            {actionLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}