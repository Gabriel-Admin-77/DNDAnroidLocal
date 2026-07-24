import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.dnd.app',
  appName: 'D&D AI Game Master',
  webDir: 'out',
  server: {
    androidScheme: 'https'
  }
};

export default config;
