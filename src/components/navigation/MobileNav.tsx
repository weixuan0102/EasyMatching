'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import {
  AppBar,
  Box,
  IconButton,
  Toolbar,
  Tooltip,
  Typography
} from '@mui/material';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import LogoutIcon from '@mui/icons-material/Logout';
import FavoriteIcon from '@mui/icons-material/Favorite';

const mobileNavItems = [
  { href: '/chat', label: 'Chat', icon: <ChatBubbleOutlineIcon /> },
  { href: '/profile', label: 'Profile', icon: <PersonOutlineIcon /> },
  { href: '/matching', label: 'Matching', icon: <FavoriteBorderIcon /> },
  { href: '/likes', label: 'Likes', icon: <FavoriteIcon /> }
];

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <AppBar
      position="sticky"
      color="default"
      elevation={0}
      sx={{
        display: { xs: 'flex', md: 'none' },
        borderBottom: 1,
        borderColor: 'divider'
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <Typography variant="h6" fontWeight={700}>
          EasyMatching
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {mobileNavItems.map((item) => {
            const isActive = pathname?.startsWith(item.href);
            return (
              <Tooltip title={item.label} key={item.href}>
                <IconButton
                  component={Link}
                  href={item.href}
                  color={isActive ? 'primary' : 'default'}
                >
                  {item.icon}
                </IconButton>
              </Tooltip>
            );
          })}
          <Tooltip title="Sign out">
            <IconButton
              color="default"
              onClick={() => signOut({ callbackUrl: '/auth/login' })}
            >
              <LogoutIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

