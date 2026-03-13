import React, { useRef, useState } from 'react'; // Fixed syntax error here
import { useApi, configApiRef, githubAuthApiRef, alertApiRef } from '@backstage/core-plugin-api';
import { Table, Progress, ResponseErrorPanel } from '@backstage/core-components';
import { TextField, Button, CircularProgress } from '@material-ui/core'; 
import useAsync from 'react-use/lib/useAsync';

export const TerraformStatus = () => {
  const configApi = useApi(configApiRef);
  const githubAuth = useApi(githubAuthApiRef);
  const alertApi = useApi(alertApiRef);

  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [isProvisioning, setIsProvisioning] = useState<string | null>(null);

  // 1. Fetch Available Templates (Top Table)
  const { value: templatesData, loading: loadingTemplates, error: errorTemplates } = useAsync(async () => {
    const token = await githubAuth.getAccessToken(['read:user']);
    const baseUrl = configApi.getString('backend.baseUrl');
    const response = await fetch(`${baseUrl}/api/proxy/wcd-api/status`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Failed to fetch status');
    return response.json();
  }, []);

  // 2. Fetch User Workspaces (Bottom Table)
  // FIX: Change 'reload: reloadWS' to 'retry: reloadWS'
  const { value: workspaceList, loading: loadingWS, retry: reloadWS, error: errorWS } = useAsync(async () => {
    const token = await githubAuth.getAccessToken(['read:user']);
    const baseUrl = configApi.getString('backend.baseUrl');
    const response = await fetch(`${baseUrl}/api/proxy/wcd-api/workspaces`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Failed to fetch workspaces');
    return response.json();
  }, []);

  const handleProvision = async (templateName: string) => {
    const workspaceName = inputRefs.current[templateName]?.value;

    if (!workspaceName || workspaceName.trim() === '') {
      alertApi.post({ message: 'Please enter a workspace name', severity: 'error' });
      return;
    }
    
    // Start Loading
    setIsProvisioning(templateName);

    try {
      const token = await githubAuth.getAccessToken(['read:user']);
      const baseUrl = configApi.getString('backend.baseUrl');
      const response = await fetch(`${baseUrl}/api/proxy/wcd-api/provision`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({
          template_name: templateName,
          workspace_name: workspaceName
        })
      });

      if (!response.ok) throw new Error(await response.text());
      
      alertApi.post({ message: `Successfully provisioned ${workspaceName}`, severity: 'success' });
      
      // Clear input
      if (inputRefs.current[templateName]) {
          inputRefs.current[templateName]!.value = '';
      }
      
      // Trigger refresh of the bottom table
      reloadWS(); 

    } catch (e: any) {
      alertApi.post({ message: e.message, severity: 'error' });
    } finally {
      // Stop Loading
      setIsProvisioning(null);
    }
  };

  // UI state checks
  if (loadingTemplates || loadingWS) return <Progress />;
  if (errorTemplates) return <ResponseErrorPanel error={errorTemplates} />;
  if (errorWS) return <ResponseErrorPanel error={errorWS} />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', padding: '20px' }}>
      
      <Table
        title="Available Terraform Templates"
        data={templatesData?.available_templates?.map((t: string) => ({ name: t })) || []}
        columns={[
          { title: 'Template', field: 'name', highlight: true },
          {
            title: 'Desired Workspace Name',
            render: (row: any) => (
              <TextField
                variant="outlined"
                size="small"
                placeholder="e.g. prod-web-server"
                // Disable input while any provisioning is happening
                disabled={isProvisioning !== null}
                inputRef={(el) => (inputRefs.current[row.name] = el)}
              />
            ),
          },
          {
            title: 'Action',
            render: (row: any) => (
              <Button
                variant="contained"
                color="primary"
                // Disable button if ANY provisioning is happening
                disabled={isProvisioning !== null}
                onClick={() => handleProvision(row.name)}
                startIcon={isProvisioning === row.name ? <CircularProgress size={20} color="inherit" /> : null}
              >
              {isProvisioning === row.name ? 'Provisioning...' : 'Provision'}
              </Button>
            ),
          },
        ]}
        options={{ paging: false, search: false }}
      />

      <Table
        title="Your Active Workspaces"
        options={{ paging: true, search: true }}
        data={workspaceList || []}
        columns={[
          { title: 'Workspace Name', field: 'workspace_name', highlight: true },
          { title: 'Template Used', field: 'template' },
          {
            title: 'Created At',
            field: 'timestamp',
            render: (row: any) => row.timestamp ? new Date(row.timestamp).toLocaleString() : 'N/A'
          },
          { title: 'Status', field: 'status' },
          { title: 'Created Resource', field: 'pod' }
        ]}
      />
    </div>
  );
};

export const ExampleComponent = TerraformStatus;

