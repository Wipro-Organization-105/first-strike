import {
  createPlugin,
  createRoutableExtension,
} from '@backstage/core-plugin-api';

import { rootRouteRef } from './routes';

export const wcdPlugin = createPlugin({
  id: 'wcd',
  routes: {
    root: rootRouteRef,
  },
});

export const WcdPage = wcdPlugin.provide(
  createRoutableExtension({
    name: 'WcdPage',
    component: () =>
      import('./components/ExampleComponent').then(m => m.ExampleComponent),
    mountPoint: rootRouteRef,
  }),
);
