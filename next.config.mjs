import { config } from 'dotenv';
config();

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove any image domains that were only used for cartoon slides
  // images: {
  //   domains: ['oaidalleapiprodscus.blob.core.windows.net', 'rhnmmitdlqcfxdkpchmx.supabase.co'],
  // },
};

export default nextConfig;
