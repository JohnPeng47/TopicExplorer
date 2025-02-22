import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { LucideIcon, WashingMachine } from 'lucide-react'

type IconCallback = {
  icon: LucideIcon
  callback: () => void
}

type ClickableTooltipProps = {
  iconCallbacks: IconCallback[]
  buttonText: string
}

export function ClickableTooltip({ iconCallbacks, buttonText }: ClickableTooltipProps = { iconCallbacks: [], buttonText: 'Click me' }) {
  const [isOpen, setIsOpen] = useState(false)

  const handleButtonClick = () => {
    setIsOpen(!isOpen)
  }

  const handleIconClick = (callback: () => void) => {
    callback()
    setIsOpen(false)
  }

  return (
    <TooltipProvider>
      <Tooltip open={isOpen}>
        <TooltipTrigger asChild>
          <Button size="fit_icon" variant="ghost" onClick={handleButtonClick}><WashingMachine/></Button>
        </TooltipTrigger>
        <TooltipContent className="p-0">
          <div className="flex flex-col space-y-1 p-2">
            {iconCallbacks.map((item, index) => {
              const Icon = item.icon
              return (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => handleIconClick(item.callback)}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  <span>Option {index + 1}</span>
                </Button>
              )
            })}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}