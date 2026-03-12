import { createDevApp } from '@backstage/dev-utils';
import { wcdPanelPlugin, WcdPanelPage } from '../src/plugin';

createDevApp()
  .registerPlugin(wcdPanelPlugin)
  .addPage({
    element: <WcdPanelPage />,
    title: 'Root Page',
    path: '/wcd-panel',
  })
  .render();
