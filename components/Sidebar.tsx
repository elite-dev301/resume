"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useThemeContext } from "@/theme/theme";
import { Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Box, Toolbar, Typography, IconButton, Button, Tooltip } from "@mui/material";
import { Dashboard, Work, People, Assignment, Event, DarkMode, LightMode, AutoGraph, ViewSidebar, ViewSidebarRounded } from "@mui/icons-material";
import { useState } from "react";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: <Dashboard />, exact: false },
  { href: "/job", label: "Jobs", icon: <Work /> },
  // { href: "/member", label: "Members", icon: <People /> },
  { href: "/application", label: "Applications", icon: <Assignment /> },
  { href: "/interview", label: "Interviews", icon: <Event /> },
  { href: "/statistics", label: "Statistics", icon: <AutoGraph /> },
];

const Sidebar = () => {
  const pathname = usePathname();
  const { toggleTheme, isDarkMode } = useThemeContext();
  const [open, setOpen] = useState(true);

  return (
    <>
      <Drawer variant={open ? "permanent" : "temporary"} sx={{
        width: 240,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: 240,
          boxSizing: 'border-box',
        },
      }}>
        <Toolbar sx={{ px: "8px !important" }}>
          <IconButton onClick={() => setOpen(open => !open)}>
            <ViewSidebarRounded color="action" />
          </IconButton>
          <IconButton sx={{ ml: "auto" }} onClick={toggleTheme}>
            {isDarkMode ? <LightMode color="primary" /> : <DarkMode color="primary" />}
          </IconButton>
        </Toolbar>
        {/* Sidebar Navigation */}
        <Box sx={{ flexGrow: 1 }}>
          <List>
            {links.map(({ href, label, icon, exact }) => (
              <ListItem key={href} disablePadding>
                <ListItemButton component={Link} href={href} selected={pathname === href || (!exact && pathname.startsWith(href))}>
                  <ListItemIcon>{icon}</ListItemIcon>
                  <ListItemText primary={label} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>
      <IconButton onClick={() => setOpen(open => !open)}
        sx={{ display: open ? "none" : "flex", position: "fixed", top: "12px", left: "8px" }}>
        <ViewSidebarRounded color="action" />
      </IconButton>
    </>
  );
};

export default Sidebar;
