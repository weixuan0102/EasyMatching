import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: DefaultSession['user'] & {
      id: string;
      uid: string;
      loginId: string | null;
      username: string;
      onboardingCompleted: boolean;
    };
  }

  interface User {
    uid: string;
    loginId: string | null;
    username: string;
    onboardingCompleted: boolean;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    uid?: string;
    loginId?: string | null;
    username?: string;
    onboardingCompleted?: boolean;
  }
}

