"use client"

import { signout } from "@/app/lib/actions";
import { useThemeContext } from "@/theme/theme";
import { Role } from "@/types/member";
import { Dashboard, Work, Assignment, AutoGraph, Event, DarkMode, LightMode, AccountCircle } from "@mui/icons-material";
import { AppBar, Avatar, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Menu, MenuItem, Toolbar as MUIToolbar, TextField, Tooltip, Typography } from "@mui/material"
import { Session } from "next-auth";
import Link from "next/link";
import React, { useState } from "react";
import { useFormState } from "react-dom";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: <Dashboard />, roles: [Role.Member] },
  { href: "/job", label: "Jobs", icon: <Work /> },
  // { href: "/member", label: "Members", icon: <People /> },
  { href: "/application", label: "Applications", icon: <Assignment />, roles: [Role.Member] },
  { href: "/interview", label: "Interviews", icon: <Event /> },
  { href: "/statistics", label: "Statistics", icon: <AutoGraph /> },
];

export const Toolbar = ({ session }: { session: Session | null }) => {

  const [errorMessage, formAction] = useFormState(
    signout,
    undefined,
  );

  const { toggleTheme, isDarkMode } = useThemeContext();

  const [anchorElUser, setAnchorElUser] = React.useState<null | HTMLElement>(null);

  const [openChangePassword, setOpenChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleOpenChangePassword = () => {
    setOpenChangePassword(true);
    handleCloseUserMenu();
  };

  const handleCloseChangePassword = () => {
    setOpenChangePassword(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      alert("New password and confirm password do not match.");
      return;
    }

    // Call your API to change the password
    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: session!.user.id,
          current: currentPassword,
          new: newPassword,
        }),
      });

      if (response.ok) {
        alert("Password changed successfully.");
        handleCloseChangePassword();
      } else {
        const error = await response.json();
        alert(error.message || "Failed to change password.");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred while changing the password.");
    }
  };

  return (
    <AppBar position="static">
      <MUIToolbar>
        <Typography variant="h5" component="div" fontWeight={600}>
          HUJI
        </Typography>
        <Box sx={{ ml: 2, flexGrow: 1, display: 'flex', flexWrap: 'wrap' }}>
          {session && links.filter(link => session.user.role === "Admin" || link.roles?.includes(session.user.role)).map((link) => (
            <Link href={link.href} key={link.href}>
              <Button
                key={link.href}
                sx={{ mx: 0.5, color: 'white', display: 'block' }}
              >
                {link.label}
              </Button>
            </Link>
          ))}
        </Box>
        <IconButton onClick={toggleTheme}>
          {isDarkMode ? <LightMode sx={{ color: 'white' }} /> : <DarkMode sx={{ color: 'white' }} />}
        </IconButton>
        {!!session && <Box sx={{ flexGrow: 0 }}>
          <Tooltip title="Open settings">
            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleOpenUserMenu}
              color="inherit"
            >
              <AccountCircle />
            </IconButton>
          </Tooltip>
          <Menu
            sx={{ mt: '45px' }}
            id="menu-appbar"
            anchorEl={anchorElUser}
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={Boolean(anchorElUser)}
            onClose={handleCloseUserMenu}
          >
            <MenuItem onClick={handleOpenChangePassword}>
              <Typography sx={{ textAlign: 'center' }}>Change Password</Typography>
            </MenuItem>
            <MenuItem>
              <form action={formAction}>
                <button
                  type="submit"
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                  }}
                >
                  <Typography sx={{ textAlign: 'center', cursor: 'pointer' }}>Sign Out</Typography>
                </button>
              </form>
            </MenuItem>
          </Menu>
        </Box>}
      </MUIToolbar>

      {/* Change Password Modal */}
      <Dialog open={openChangePassword} onClose={handleCloseChangePassword}>
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label="Current Password"
            type="password"
            fullWidth
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
          <TextField
            margin="dense"
            label="New Password"
            type="password"
            fullWidth
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <TextField
            margin="dense"
            label="Confirm Password"
            type="password"
            fullWidth
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseChangePassword}>Cancel</Button>
          <Button onClick={handleChangePassword} variant="contained">
            Change Password
          </Button>
        </DialogActions>
      </Dialog>
    </AppBar>
  )
}