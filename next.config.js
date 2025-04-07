/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'm.media-amazon.com',
      'www.dyson.com',
      'www.ghdhair.com',
      'www.revlon.com',
      // Add any other domains you need to load images from
    ],
  },
};

module.exports = nextConfig;