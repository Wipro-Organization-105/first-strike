// plugins/my-data/src/plugin.ts
import {
  createPlugin,
  createRoutableExtension,
  createApiFactory,
  discoveryApiRef,
  fetchApiRef,
} from '@backstage/core-plugin-api';

import { rootRouteRef } from './routes';
import { myDataApiRef, MyDataClient } from './api/MyDataApi';

export const myDataPlugin = createPlugin({
  id: 'my-data',
  apis: [
    createApiFactory({
      api: myDataApiRef,
      deps: { discoveryApi: discoveryApiRef, fetchApi: fetchApiRef },
      factory: ({ discoveryApi, fetchApi }) =>
        new MyDataClient({ discoveryApi, fetchApi }),
    }),
  ],
  routes: {
    root: rootRouteRef,
  },
});

export const MyDataPage = myDataPlugin.provide(
  createRoutableExtension({
    name: 'MyDataPage',
    component: () =>
      import('./components/ExampleComponent').then(m => m.ExampleComponent),
    mountPoint: rootRouteRef,
  }),
);
