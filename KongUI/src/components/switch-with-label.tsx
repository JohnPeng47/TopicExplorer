'use client'

import * as React from "react"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

interface SwitchWithLabelProps {
  label: string
  id: string
  onCheckedChange?: (checked: boolean) => void
  defaultChecked?: boolean
  placeholder?: string
}

export function SwitchWithLabel({
  label,
  id,
  onCheckedChange,
  defaultChecked = false,
  placeholder
}: SwitchWithLabelProps) {
  return (
    <div className="flex flex-col space-y-2">
      <div className="flex items-center space-x-2">
        <Switch
          id={id}
          onCheckedChange={onCheckedChange}
          defaultChecked={defaultChecked}
        />
        <Label htmlFor={id}>{label}</Label>
      </div>
      {placeholder && (
        <p className="text-sm text-muted-foreground pl-14">{placeholder}</p>
      )}
    </div>
  )
}

// Example usage
function Demo() {
  const handleCheckedChange = (checked: boolean) => {
    console.log("Switch toggled:", checked)
  }

  return (
    <div className="p-4 space-y-4">
      <SwitchWithLabel
        label="Airplane Mode"
        id="airplane-mode"
        onCheckedChange={handleCheckedChange}
        placeholder="Turn off all wireless communications"
      />
      <SwitchWithLabel
        label="Dark Mode"
        id="dark-mode"
        onCheckedChange={handleCheckedChange}
        placeholder="Switch to a darker color scheme"
      />
    </div>
  )
}