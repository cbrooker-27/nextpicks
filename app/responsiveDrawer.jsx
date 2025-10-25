"use client";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import CssBaseline from "@mui/material/CssBaseline";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import MenuIcon from "@mui/icons-material/Menu";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn, signOut, useSession } from "next-auth/react";
import { Avatar, ListItemAvatar, ListSubheader, Skeleton } from "@mui/material";
import {
  Add,
  Cottage,
  EditCalendar,
  EventRepeat,
  Leaderboard,
  Park,
  TableChart,
  TaskAlt,
  Visibility,
} from "@mui/icons-material";

const drawerWidth = 240;

export default function ResponsiveDrawer(props) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const router = useRouter();
  const { data: session, status } = useSession();

  const navSections = [
    {
      sectionname: "Picks",
      navItems: [
        {
          itemname: "Home",
          icon: Cottage,
          target: "/",
        },
        {
          itemname: "Make Picks",
          icon: TaskAlt,
          target: "/picks/makePicks",
        },
        {
          itemname: "View Picks",
          icon: Visibility,
          target: "/picks/view",
        },
        {
          itemname: "Table View",
          icon: TableChart,
          target: "/picks/viewTable",
        },
        {
          itemname: "Standings",
          icon: Leaderboard,
          target: "/picks/standings",
        },
        {
          itemname: "Previous Weeks",
          icon: EventRepeat,
          target: "/picks/previousWeeks",
          disabled: true,
        },
      ],
    },
    {
      sectionname: "Admin",
      navItems: [
        {
          itemname: "Change Week",
          icon: EditCalendar,
          target: "/picks/changeWeek",
        },
        {
          itemname: "Add Games",
          icon: Add,
          target: "/picks/addGames",
        },
      ],
    },
    {
      sectionname: "Family",
      navItems: [
        {
          itemname: "XMAS",
          icon: Park,
          target: "/xmas",
        },
      ],
    },
  ];

  const handleDrawerClose = () => {
    setIsClosing(true);
    setMobileOpen(false);
  };

  const handleDrawerTransitionEnd = () => {
    setIsClosing(false);
  };

  const handleDrawerToggle = () => {
    if (!isClosing) {
      setMobileOpen(!mobileOpen);
    }
  };

  const loggedIn = session != null;
  const userName = loggedIn ? session.user.name : "Guest";

  const drawer = (
    <div>
      <Toolbar />
      <Divider />
      <List>
        {status === "loading" ? (
          <Skeleton key="skeleton">
            <ListItem key="skeleton" disablePadding>
              <ListItemButton>
                <ListItemAvatar>
                  <Avatar />
                </ListItemAvatar>
                <ListItemText primary="Loading..." />
              </ListItemButton>
            </ListItem>
          </Skeleton>
        ) : (
          <ListItem key="user" disablePadding>
            <ListItemButton
              onClick={() => {
                loggedIn ? signOut() : signIn(null, {}, { prompt: "select_account" });
              }}
            >
              <ListItemAvatar>
                <Avatar src={session?.user?.image} />
              </ListItemAvatar>
              <ListItemText primary={`Welcome ${userName}`} secondary={loggedIn ? "Sign Out" : "Sign In"} />
            </ListItemButton>
          </ListItem>
        )}

        {navSections.map((section) => (
          <div key={section.sectionname}>
            <ListSubheader key={section.sectionname}>{section.sectionname}</ListSubheader>
            {section.navItems.map((navItem) => (
              <ListItem key={navItem.itemname} disablePadding>
                <ListItemButton
                  onClick={() => {
                    router.push(navItem.target);
                    handleDrawerClose();
                  }}
                  disabled={navItem.disabled}
                >
                  <ListItemIcon>
                    <navItem.icon />
                  </ListItemIcon>
                  <ListItemText primary={navItem.itemname} />
                </ListItemButton>
              </ListItem>
            ))}
          </div>
        ))}
      </List>
    </div>
  );

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: "none" } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div">
            ChrisBrooker.com
          </Typography>
        </Toolbar>
      </AppBar>
      <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }} aria-label="mailbox folders">
        {/* The implementation can be swapped with js to avoid SEO duplication of links. */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onTransitionEnd={handleDrawerTransitionEnd}
          onClose={handleDrawerClose}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: "block", sm: "none" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", sm: "block" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
        }}
      >
        <Toolbar />
        {props.children}
      </Box>
    </Box>
  );
}
