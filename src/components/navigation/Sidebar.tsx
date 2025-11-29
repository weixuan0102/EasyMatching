'use client';

import { useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import useSWR, { useSWRConfig } from 'swr';
import {
  Avatar,
  Badge,
  Box,
  Button,
  Divider,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Typography
} from '@mui/material';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import LogoutIcon from '@mui/icons-material/Logout';
import FavoriteIcon from '@mui/icons-material/Favorite';

import { apiClient } from '@/lib/api';
import { getPusherClient } from '@/lib/pusher-client';

type NavItem = {
  label: string;
  href: string;
  icon: React.ReactElement;
};

const navItems: NavItem[] = [
  {
    label: 'Chat',
    href: '/chat',
    icon: <ChatBubbleOutlineIcon />
  },
  {
    label: 'Profile',
    href: '/profile',
    icon: <PersonOutlineIcon />
  },
  {
    label: 'Matching',
    href: '/matching',
    icon: <FavoriteBorderIcon />
  },
  {
    label: 'Likes',
    href: '/likes',
    icon: <FavoriteIcon />
  }
];

const fetcher = (url: string) => apiClient.get(url).then((res) => res.data);

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { mutate } = useSWRConfig();
  const { data: likesData } = useSWR<{ count: number }>('/api/user/likes/count', fetcher, {
    refreshInterval: 30000 // Refresh every 30 seconds
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

  const activeHref = useMemo(() => {
    if (!pathname) {
      return '';
    }

    const base = `/${pathname.split('/')[1] ?? ''}`;
    return base;
  }, [pathname]);

  return (
    <Box
      component="aside"
      sx={{
        width: 260,
        borderRight: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
        px: 3,
        py: 4,
        display: { xs: 'none', md: 'flex' },
        flexDirection: 'column',
        gap: 3,
        position: 'sticky',
        top: 0,
        height: '100vh'
      }}
    >
      <Stack spacing={1}>
        <Typography variant="h5" fontWeight={700}>
          EasyMatching
        </Typography>
        <Typography variant="body2" color="text.secondary">
          連結有趣的人，從興趣開始。
        </Typography>
      </Stack>

      <Stack direction="row" alignItems="center" spacing={2}>
        <Avatar
          src={session?.user?.image ?? undefined}
          alt={session?.user?.username ?? '使用者'}
          sx={{ width: 48, height: 48 }}
        >
          {session?.user?.username?.[0]?.toUpperCase() ?? 'U'}
        </Avatar>
        <Stack spacing={0.5}>
          <Typography variant="subtitle1" fontWeight={600}>
            {session?.user?.username ?? '匿名使用者'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {session?.user?.loginId ?? '未設定 userID'}
          </Typography>
        </Stack>
      </Stack>

      <Divider />

      <List sx={{ flexGrow: 1, px: 0 }}>
        {navItems.map((item) => {
          const isActive = activeHref === item.href;
          const isLikes = item.href === '/likes';
          const showBadge = isLikes && (likesData?.count ?? 0) > 0;

          return (
            <ListItemButton
              key={item.href}
              component={Link}
              href={item.href}
              selected={isActive}
              sx={{
                borderRadius: 2,
                mb: 1,
                '&.Mui-selected': {
                  bgcolor: 'primary.light',
                  color: 'primary.contrastText',
                  '& .MuiListItemIcon-root': {
                    color: 'primary.contrastText'
                  }
                }
              }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                {showBadge ? (
                  <Badge badgeContent={likesData?.count} color="error">
                    {item.icon}
                  </Badge>
                ) : (
                  item.icon
                )}
              </ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          );
        })}
      </List>

      <Divider />

      <Button
        variant="outlined"
        color="inherit"
        startIcon={<LogoutIcon />}
        onClick={() => signOut({ callbackUrl: '/auth/login' })}
      >
        Sign out
      </Button>
    </Box>
  );
}

