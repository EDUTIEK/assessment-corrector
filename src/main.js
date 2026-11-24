/**
 * main.js
 *
 * Bootstraps Vuetify and other plugins then mounts the App`
 */

import { handleOpen } from '@/lib/OpenHelper';

// Handle an opening of the app
// This must be done before anything else is loaded.
// Static imports are hoisted and would be evaluated before this call,
// so the rest of the app is loaded with dynamic imports.
// location.replace() does not stop the script, so we have to return explicitly.
async function bootstrap() {
  if (handleOpen()) {
    // a redirect is in progress: don't initialize vue
    return;
  }

  const { createApp } = await import('vue');
  const { default: App } = await import('./App.vue');
  const { registerPlugins } = await import('@/plugins');

  const app = createApp(App);
  registerPlugins(app);
  app.mount('#app');
}

bootstrap();
