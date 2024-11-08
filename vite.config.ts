import { defineConfig } from 'vite';
import monkey from 'vite-plugin-monkey';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    monkey({
      entry: 'src/main.ts',
      userscript: {
        icon: 'https://vitejs.dev/logo.svg',
        namespace: 'npm/vite-plugin-monkey',
        match: ['https://pkg.go.dev/*'],
        connect: [
          "fanyi-api.baidu.com",
          "openapi.youdao.com",
        ],
      },
    }),
  ],
  build: {
    minify: true
  }
});
