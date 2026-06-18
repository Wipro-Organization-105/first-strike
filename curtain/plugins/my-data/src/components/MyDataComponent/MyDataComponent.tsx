import React from 'react';
import { Table, Progress, ResponseErrorPanel } from '@backstage/core-components';
//import { useApi } from '@backstage/core-plugin-api';
import {
  createPlugin,
  createRoutableExtension,
  createApiFactory,
  discoveryApiRef,
  fetchApiRef,
  useApi,
} from '@backstage/core-plugin-api';
import { myDataApiRef } from '../../api/MyDataApi';
import useAsync from 'react-use/lib/useAsync';

export const MyDataComponent = () => {
  const api = useApi(myDataApiRef);

  const { value, loading, error } = useAsync(async () => {
    return await api.getItems();
  }, []);

  if (loading) return <Progress />;
  if (error) return <ResponseErrorPanel error={error} />;

  const columns = [
    { title: 'VIN', field: 'vehicle.vin' },
    { title: 'Model', field: 'vehicle.model' },
    { title: 'Connectivity', field: 'connectivity.state' },
    { title: 'eCall Status', field: 'eCall.activationStatus' },
  ];

  return (
    <Table
      title="Vehicle Telemetry Data"
      columns={columns}
      // CRITICAL: Your API returns {} but Table needs []. We wrap it here:
      data={value ? [value] : []} 
    />
  );
export const MyDataPageNew = myDataComponent.provide(
  createRoutableExtension({
    name: 'MyDataPageNew',
    component: () =>
      import('./components/MyDataComponent/MyDataComponent').then(m => m.ExampleComponent),
    mountPoint: rootRouteRef,
  }),
);
