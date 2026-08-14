import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';

export default defineConfig({
  output: 'server',
  adapter: vercel({ imageService: false }),
  site: 'https://holospacexr.com',
  trailingSlash: 'never',
  redirects: {
    '/awards': '/',
    '/awards/UrkundeBestDemoAward_SketchViz.pdf': '/',
  },
});
