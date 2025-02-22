"use client"

import React, { useState, useRef, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { IconType } from 'react-icons'
import { MdEmail, MdPhone, MdMessage, MdShare } from 'react-icons/md'
import { WashingMachine } from 'lucide-react'
import { useFloating, useInteractions, useClick, useDismiss, offset, flip, shift } from '@floating-ui/react';

export type IconButton = {
  icon: IconType
  name: string
  onClick: () => void
}

type IconButtonRowProps = {
  isLoading: boolean
  buttons: IconButton[]
}

export function ClickableToolTip({buttons, isLoading}: IconButtonRowProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    placement: 'top', // This sets the preferred placement to top
    middleware: [
      offset(10), // Adds some space between the button and tooltip
      flip(), // Flips the tooltip if there's not enough space on top
      shift(), // Shifts the tooltip horizontally if needed
    ],
  });

  const click = useClick(context);
  const dismiss = useDismiss(context);
  const { getReferenceProps, getFloatingProps } = useInteractions([
    click,
    dismiss,
  ]);

  const handleToggle = () => {
    setIsOpen(!isOpen)
  }

  const handleMouseLeave = () => {
    setIsOpen(false)
  }

  return (
    <div 
      className="flex flex-col items-center justify-center" 
      style={{ zIndex: 1 }} 
      ref={refs.setReference}
      {...getReferenceProps()}
    >
      {isOpen && (
        <div 
          ref={refs.setFloating}
          style={floatingStyles}
          {...getFloatingProps()}
          className="flex space-x-2"
          onMouseLeave={handleMouseLeave}
        >
          {buttons.map((button, index) => (
            <TooltipProvider key={index}>
              <Tooltip delayDuration={100}>
                <TooltipTrigger asChild>
                  <Button
                    style={{ zIndex: 1 }}
                    variant="outline"
                    size="icon"
                    className="hover:bg-primary/10 transition-colors duration-200"
                    onClick={() => {
                      button.onClick()
                      setIsOpen(false)
                    }}
                  >
                    <button.icon className="h-5 w-5" />
                    <span className="sr-only">{button.name}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  {button.name}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>
      )}
      
      <Button size="fit_icon" variant="icon" onClick={handleToggle} style={{marginRight: 0}}>
        <WashingMachine className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
      </Button>
    </div>
  )
}