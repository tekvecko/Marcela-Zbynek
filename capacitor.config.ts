
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.weddingphotoqust.app',
  appName: 'Svatební Fotovýzvy',
  webDir: 'dist/public',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    Camera: {
      permissions: ["camera", "photos"]
    },
    Filesystem: {
      permissions: ["write_external_storage"]
    }
  }
};

export default config;
