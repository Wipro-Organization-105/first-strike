import { createApiRef, DiscoveryApi, FetchApi } from '@backstage/core-plugin-api';

// 1. Define the API Reference
export const myDataApiRef = createApiRef<MyDataApi>({
  id: 'plugin.my-data.service',
});

export interface MyDataApi {
  getItems(): Promise<any>;
}

// 2. Implement the Client
export class MyDataClient implements MyDataApi {
  private readonly discoveryApi: DiscoveryApi;
  private readonly fetchApi: FetchApi;

  constructor(options: { discoveryApi: DiscoveryApi; fetchApi: FetchApi }) {
    this.discoveryApi = options.discoveryApi;
    this.fetchApi = options.fetchApi;
  }

  async getItems(): Promise<any> {
    // Dynamic Discovery: Finds where your backend plugin is running
    const baseUrl = await this.discoveryApi.getBaseUrl('my-data-backend');

    // Secure Fetch: Automatically handles Backstage Identity tokens if needed
    const response = await this.fetchApi.fetch(`${baseUrl}/external-data`);

    if (!response.ok) {
      throw new Error('Failed to fetch data');
    }
    return await response.json();
  }
}

