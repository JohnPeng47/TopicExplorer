'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Copy, Check } from "lucide-react"

import { CopyModalProps } from './common-types'

export function CopyModal({ generatedText, onClose, title, description, otherActionLabel, onOtherAction }: CopyModalProps) {
  const [open, setOpen] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    setOpen(true)
  }, [])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedText)
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Textarea
            readOnly
            value={generatedText}
            className="min-h-[100px]"
          />
        </div>
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
          <Button onClick={onOtherAction}>
            {otherActionLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}