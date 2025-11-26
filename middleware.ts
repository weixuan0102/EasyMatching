export { default } from 'next-auth/middleware';

export const config = {
  matcher: [
    '/chat/:path*',
    '/profile/:path*',
    '/matching/:path*',
    '/onboarding',
    '/api/conversations/:path*',
    '/api/user/:path*'
  ]
};
