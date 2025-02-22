'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Copy, Check } from "lucide-react"
import MarkdownPreview from '@uiw/react-markdown-preview';


import { CopyModalProps } from './common-types'

type LargeCopyModalProps = Omit<CopyModalProps, 'otherActionLabel' | 'onOtherAction'>;

export function LargeModalWCopy({ generatedText: markdownText, onClose, title, description }: LargeCopyModalProps) {
  const [open, setOpen] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    setOpen(true)
  }, [])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(markdownText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      onClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-grow border rounded-md p-4 my-4">
          <MarkdownPreview source={markdownText} className="p-6 bg-amber-50 rounded-lg shadow-md text-slate-800 text-sm font-sans"/>
        </ScrollArea>
        <DialogFooter className="sm:justify-start">
          <Button variant="secondary" className="w-[120px]" onClick={handleCopy}>
            {copied ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Copied
              </>
            ) : (
              <>
                <Copy className="mr-2 h-4 w-4" />
                Copy text
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}