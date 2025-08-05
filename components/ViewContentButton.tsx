import { Dialog, Tooltip, IconButton, DialogTitle, DialogContent, Typography, DialogActions, Button, Box } from "@mui/material";
import React, { useState } from "react";

// View Button with Modal
const ViewContentButton: React.FC<{ title: string, content: string, childButton?: boolean, children: React.ReactNode }> = ({ title, content, childButton, children }) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Tooltip title={title}>
        <Box onClick={() => setOpen(true)}>
          {childButton ? <>{children}</> :
            <IconButton>
              {children}
            </IconButton>
          }
        </Box>
      </Tooltip>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md">
        <DialogTitle>{title}</DialogTitle>
        <DialogContent>
          <Typography whiteSpace="pre-line">{content}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ViewContentButton;