'use client'

import { useContext } from 'use-context-selector';
import { useState, useEffect, useRef } from 'react'
import { X, ChevronRight } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { AlertBoxContext } from '../common/provider/AlertBoxProvider'
import { TreeEditMapContext } from '../concept_map/provider/TreeEditMapProvider'

import { RFNodeData } from '../common/common-types';

type SideMenuProps = {
  children?: React.ReactNode
  data?: RFNodeData; 
  setIsOpen: (isOpen: boolean) => void
  isOpen: boolean
}

export function SideMenu({ data, setIsOpen, isOpen }: SideMenuProps = { setIsOpen: () => {}, isOpen: false }) {
  const [model, setModel] = useState('gpt3')
  const [llmInstr, setLlmInstr] = useState("")
  const [loading, setLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [subgraphTreeData, setSubgraphTreeData] = useState(null)

  const { sendToast } = useContext(AlertBoxContext)
  const { genSubGraph, getSubgraphTree } = useContext(TreeEditMapContext)

  const handleGenerateSubtopics = () => {
    setLoading(true)
    console.log("Generating topics with: ", llmInstr)
    genSubGraph(data?.id || '', model, llmInstr)
      .then((_) => {
        sendToast("Finished generating!", "success")
      })
      .catch((err) => {
        sendToast(`Server error: ${err}`, "error")
      })
      .finally(() => {
        setLoading(false)
      })
  }

  const handleGetSubgraphTree = () => {
    setLoading(true)
    console.log("Getting tree with: ", data?.id)
    getSubgraphTree(data?.id || '')
      .then((res) => {
        console.log("Subgraph tree:", res.data)
        setSubgraphTreeData(res.data)
        setDialogOpen(true)
        sendToast("Subgraph tree fetched successfully!", "success")
      })
      .catch((err) => {
        console.error("Error fetching subgraph tree:", err)
        sendToast(`Error fetching subgraph tree: ${err}`, "error")
      })
      .finally(() => {
        setLoading(false)
      })
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent 
        className="w-[300px] sm:w-[400px]"
        onPointerDownOutside={(e) => {
          e.preventDefault()
        }}
      >
        <SheetHeader>
          <SheetTitle>Edit Node</SheetTitle>
        </SheetHeader>
        <div className="grid gap-4 py-4">
          <Input  
            placeholder="Enter title"
            value={data?.title || ""}
            onChange={(e) => console.log(e.target.value)}
          />
          <Textarea
            placeholder="Enter your prompt guidance here..."
            value={llmInstr}
            onChange={(e) => setLlmInstr(e.target.value)}
            rows={6}
          />
          <div className="space-y-2">
            <Label>Model</Label>
            <RadioGroup value={model} onValueChange={setModel} className="flex space-x-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="gpt3" id="gpt3" />
                <Label htmlFor="gpt3">GPT-3</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="gpt4" id="gpt4" />
                <Label htmlFor="gpt4">GPT-4</Label>
              </div>
            </RadioGroup>
          </div>
          <Button onClick={handleGenerateSubtopics} disabled={loading}>
            {loading ? "Generating..." : "Generate Subtopics"}
          </Button>
          <Button onClick={handleGetSubgraphTree} disabled={loading}>
            {loading ? "Fetching..." : "Get Subgraph Tree"}
          </Button>
        </div>
      </SheetContent>

      <Dialog modal={false} open={dialogOpen} onOpenChange={() => {
          console.log("Dialog open changed");
          setDialogOpen(!dialogOpen)}
        }>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Subgraph Tree</DialogTitle>
          </DialogHeader>
          <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4 overflow-auto text-white">
            {JSON.stringify(subgraphTreeData, null, 2)}
          </pre>
        </DialogContent>
      </Dialog>
    </Sheet>
  )
}