import PusherServer from 'pusher';

type PusherServerConfig = {
  appId: string;
  key: string;
  secret: string;
  cluster: string;
};

const getServerConfig = (): PusherServerConfig => {
  const appId = process.env.PUSHER_APP_ID;
  const key = process.env.PUSHER_KEY;
  const secret = process.env.PUSHER_SECRET;
  const cluster = process.env.PUSHER_CLUSTER;

  if (!appId || !key || !secret || !cluster) {
    throw new Error('Pusher 環境變數未正確設定');
  }

  return { appId, key, secret, cluster };
};

declare global {
  var pusherServer: PusherServer | undefined;
}

export const pusherServer =
  global.pusherServer ??
  new PusherServer({
    ...getServerConfig(),
    useTLS: true
  });

if (process.env.NODE_ENV !== 'production') {
  global.pusherServer = pusherServer;
}

