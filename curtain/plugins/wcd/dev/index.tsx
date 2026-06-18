import { createDevApp } from '@backstage/dev-utils';
import { wcdPlugin, WcdPage } from '../src/plugin';

createDevApp()
  .registerPlugin(wcdPlugin)
  .addPage({
    element: <WcdPage />,
    title: 'Root Page',
    path: '/wcd',
  })
  .render();
