'use client';

import PusherClient from 'pusher-js';

type ClientConfig = {
  key: string;
  cluster: string;
};

const getClientConfig = (): ClientConfig => {
  const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

  if (!key || !cluster) {
    throw new Error('Pusher 前端環境變數未正確設定');
  }

  return { key, cluster };
};

let clientInstance: PusherClient | null = null;

export const getPusherClient = () => {
  if (typeof window === 'undefined') {
    throw new Error('Pusher client 僅能在瀏覽器使用');
  }

  if (!clientInstance) {
    const { key, cluster } = getClientConfig();
    clientInstance = new PusherClient(key, {
      cluster,
      forceTLS: true
    });
  }

  return clientInstance;
};

