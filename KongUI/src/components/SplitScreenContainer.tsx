import React, { ReactNode } from 'react';
import { useSplitScreen } from '@/provider/SplitScreenProvider';
import { SplitIcon } from 'lucide-react';
import { Button } from "@/components/ui/button"

interface SplitScreenContainerProps {
  LeftComponent: React.ComponentType<any>;
  RightComponent?: React.ComponentType<any>;
  leftProps?: any;
  rightProps?: any;
}

export default function SplitScreenContainer({
  LeftComponent,
  RightComponent,
  leftProps = {},
  rightProps = {}
}: SplitScreenContainerProps) {
  const { displayMode, toggleSplitScreen } = useSplitScreen(); 

  return (
    <div className="relative h-full">
      <div className="flex h-full" style={{ flexDirection: displayMode === 'split' ? 'row' : 'column' }}>
        <div className="flex-1">
          <LeftComponent {...leftProps} />
        </div>
        {displayMode === 'split' && (
          <div className="flex-1 border-l border-gray-200">
            {RightComponent && <RightComponent {...rightProps} />}
          </div>
        )}
      </div>
      <Button
        className="absolute bottom-4 left-4 rounded-full p-0 w-14 h-14 shadow-lg hover:shadow-xl transition-shadow duration-300"
        onClick={toggleSplitScreen}
        aria-label={displayMode === 'split' ? "Merge screens" : "Split screen"}
      >
        <SplitIcon className="h-6 w-6" />
      </Button>
    </div>
  );
}