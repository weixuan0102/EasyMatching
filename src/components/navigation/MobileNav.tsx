'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import useSWR, { useSWRConfig } from 'swr';
import {
  AppBar,
  Badge,
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

import { apiClient } from '@/lib/api';
import { getPusherClient } from '@/lib/pusher-client';

const mobileNavItems = [
  { href: '/chat', label: 'Chat', icon: <ChatBubbleOutlineIcon /> },
  { href: '/profile', label: 'Profile', icon: <PersonOutlineIcon /> },
  { href: '/matching', label: 'Matching', icon: <FavoriteBorderIcon /> },
  { href: '/likes', label: 'Likes', icon: <FavoriteIcon /> }
];

const fetcher = (url: string) => apiClient.get(url).then((res) => res.data);

export default function MobileNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { mutate } = useSWRConfig();
  const { data: likesData } = useSWR<{ count: number }>('/api/user/likes/count', fetcher, {
    refreshInterval: 30000
  });

  useEffect(() => {
    if (!session?.user?.id) {
      return;
    }

    const pusher = getPusherClient();
    const channelName = `user-${session.user.id}`;
    const channel = pusher.subscribe(channelName);

    channel.bind('incoming-like', () => {
      mutate('/api/user/likes/count');
    });

    return () => {
      channel.unbind('incoming-like');
      pusher.unsubscribe(channelName);
    };
  }, [session?.user?.id, mutate]);

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
            const isLikes = item.href === '/likes';
            const showBadge = isLikes && (likesData?.count ?? 0) > 0;

            return (
              <Tooltip title={item.label} key={item.href}>
                <IconButton
                  component={Link}
                  href={item.href}
                  color={isActive ? 'primary' : 'default'}
                >
                  {showBadge ? (
                    <Badge badgeContent={likesData?.count} color="error">
                      {item.icon}
                    </Badge>
                  ) : (
                    item.icon
                  )}
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

