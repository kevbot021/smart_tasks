export const getBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_VERCEL_URL) {
    return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`;
  }
  if (process.env.REPLIT_SLUG) {
    return `https://${process.env.REPLIT_SLUG}.${process.env.REPLIT_OWNER}.repl.co`;
  }
  return process.env.NEXTAUTH_URL || 'http://localhost:3000';
};
