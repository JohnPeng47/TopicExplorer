import React, { useState } from 'react';
import { Tooltip, ClickAwayListener, Button } from '@mui/material';

const WrappedTooltip = ({ children, tooltipTitle = "Add" }) => {
  const [open, setOpen] = useState(false);

  const handleTooltipClose = () => {
    setOpen(false);
  };

  const handleTooltipOpen = () => {
    setOpen(true);
  };

  return (
    <ClickAwayListener onClickAway={handleTooltipClose}>
      <div style={{ position: 'relative' }}>
        <Tooltip
          PopperProps={{
            disablePortal: true,
          }}
          onClose={handleTooltipClose}
          open={open}
          disableFocusListener
          disableHoverListener
          disableTouchListener
          title={tooltipTitle}
        >
          <Button
            onClick={handleTooltipOpen}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              opacity: 0,
              cursor: 'pointer',
            }}
          >
          </Button>
        </Tooltip>
        {children}
      </div>
    </ClickAwayListener>
  );
};

export default WrappedTooltip;