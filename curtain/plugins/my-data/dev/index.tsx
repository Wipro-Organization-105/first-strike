import { createDevApp } from '@backstage/dev-utils';
import { myDataPlugin, MyDataPage } from '../src/plugin';

createDevApp()
  .registerPlugin(myDataPlugin)
  .addPage({
    element: <MyDataPage />,
    title: 'Root Page',
    path: '/my-data',
  })
  .render();
