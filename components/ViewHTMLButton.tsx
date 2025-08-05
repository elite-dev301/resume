import { Tooltip, IconButton, Box } from "@mui/material";

const ViewHTMLButton: React.FC<{ title: string, content: string, childButton?: boolean, children: React.ReactNode }> = ({ title, content, children, childButton }) => {

  const openWindow = () => {
    const myWindow = window.open("", title, "width=900,height=900,scrollbars=yes,resizable=yes");

    if (myWindow) {
      myWindow.document.open();
      myWindow.document.write(content);
      myWindow.document.close();
    }
  }

  return (
    <>
      <Tooltip title={title}>
        <Box onClick={openWindow}>
          {childButton ? <>{children}</> :
            <IconButton>
              {children}
            </IconButton>
          }
        </Box>
      </Tooltip>
    </>
  );
};

export default ViewHTMLButton;