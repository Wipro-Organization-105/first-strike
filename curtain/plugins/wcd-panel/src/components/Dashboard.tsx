import React, { useRef, useState } from 'react';
import { useApi, configApiRef, githubAuthApiRef, alertApiRef } from '@backstage/core-plugin-api';
import { Table, Progress, ResponseErrorPanel } from '@backstage/core-components';
import { TextField, Button, CircularProgress, IconButton, Box } from '@material-ui/core'; 
import { useAsyncRetry } from 'react-use'; // Use retry version for both
import DeleteIcon from '@material-ui/icons/Delete';
import RefreshIcon from '@material-ui/icons/Refresh';
import GetAppIcon from '@material-ui/icons/GetApp';

export const Dashboard = () => {
  const configApi = useApi(configApiRef);
  const githubAuth = useApi(githubAuthApiRef);
  const alertApi = useApi(alertApiRef);
  
  const backendUrl = configApi.getString('backend.baseUrl');
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [isProvisioning, setIsProvisioning] = useState<string | null>(null);

  const { 
    value: workspaceList, 
    loading: loadingWS, 
    retry: reloadWS, 
    error: errorWS 
  } = useAsyncRetry(async () => {
    const token = await githubAuth.getAccessToken(['read:user']);
    const response = await fetch(`${backendUrl}/api/proxy/wcd-api/workspaces`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Failed to fetch workspaces');
    return response.json();
  }, [backendUrl]);

  // 2. Fetch Available Templates
  const { 
    value: templatesData, 
    loading: loadingTemplates, 
    retry: reloadTemplates, 
    error: errorTemplates 
  } = useAsyncRetry(async () => {
    const token = await githubAuth.getAccessToken(['read:user']);
    const response = await fetch(`${backendUrl}/api/proxy/wcd-api/status`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Failed to fetch status');
    return response.json();
  }, [backendUrl]);

  const handleRefreshAll = () => {
    reloadWS();
    reloadTemplates();
  };

  const handleDelete = async (name: string) => {
    if (!window.confirm(`Are you sure you want to delete ${name}?`)) return;
    try {
      const token = await githubAuth.getAccessToken(['read:user']);
      const response = await fetch(`${backendUrl}/api/proxy/wcd-api/workspaces/${name}`, { 
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Delete failed');
      alertApi.post({ message: `Deleted ${name}`, severity: 'success' });
      reloadWS(); 
    } catch (e: any) {
      alertApi.post({ message: e.message, severity: 'error' });
    }
  };

  const handleUpdate = async (name: string, template: string) => {
    try {
      const token = await githubAuth.getAccessToken(['read:user']);
      const response = await fetch(`${backendUrl}/api/proxy/wcd-api/workspaces/${name}?template_name=${template}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Update failed');
      alertApi.post({ message: `Update triggered for ${name}`, severity: 'info' });
      reloadWS();
    } catch (e: any) {
      alertApi.post({ message: e.message, severity: 'error' });
    }
  };

  const handleProvision = async (templateName: string) => {
    const workspaceName = inputRefs.current[templateName]?.value;
    if (!workspaceName?.trim()) {
      alertApi.post({ message: 'Please enter a workspace name', severity: 'error' });
      return;
    }
    setIsProvisioning(templateName);
    try {
      const token = await githubAuth.getAccessToken(['read:user']);
      const response = await fetch(`${backendUrl}/api/proxy/wcd-api/provision`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ template_name: templateName, workspace_name: workspaceName })
      });
      if (!response.ok) throw new Error(await response.text());
      alertApi.post({ message: `Successfully provisioned ${workspaceName}`, severity: 'success' });
      if (inputRefs.current[templateName]) inputRefs.current[templateName]!.value = '';
      reloadWS(); 
    } catch (e: any) {
      alertApi.post({ message: e.message, severity: 'error' });
    } finally {
      setIsProvisioning(null);
    }
  };

  //Download kubeconfig
  const handleDownloadConfig = async (workspaceName: string) => {
  try {
    const token = await githubAuth.getAccessToken(['read:user']);
    const response = await fetch(`${backendUrl}/api/proxy/wcd-api/workspaces/${workspaceName}/config`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) throw new Error('Failed to fetch kubeconfig');

    const configData = await response.json();
    const blob = new Blob([JSON.stringify(configData, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${workspaceName}.kubeconfig`);
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
  } catch (e: any) {
    alertApi.post({ message: `Download failed: ${e.message}`, severity: 'error' });
  }
};

  if (loadingTemplates || loadingWS) return <Progress />;
  if (errorTemplates || errorWS) return <ResponseErrorPanel error={(errorTemplates || errorWS)!} />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '10px' }}>
      
      {/* Global Refresh Button */}
      <Box display="flex" justifyContent="flex-end">
        <Button 
          startIcon={<RefreshIcon />} 
          variant="outlined" 
          onClick={handleRefreshAll}
        >
          Refresh All Data
        </Button>
      </Box>

      <Table
        title="Available Terraform Templates"
        data={templatesData?.available_templates?.map((t: string) => ({ name: t })) || []}
        columns={[
          { title: 'Template', field: 'name', highlight: true },
          {
            title: 'Desired Workspace Name',
            render: (row: any) => (
              <TextField
                variant="outlined" size="small" placeholder="e.g. yocto-prod"
                disabled={isProvisioning !== null}
                inputRef={(el) => (inputRefs.current[row.name] = el)}
              />
            ),
          },
          {
            title: 'Action',
            render: (row: any) => (
              <Button
                variant="contained" color="primary"
                disabled={isProvisioning !== null}
                onClick={() => handleProvision(row.name)}
              >
                {isProvisioning === row.name ? <CircularProgress size={20} /> : 'Provision'}
              </Button>
            ),
          },
        ]}
        options={{ paging: false, search: false }}
      />

      <Table
        title="Your Active Workspaces"
        data={workspaceList || []}
        columns={[
          { title: 'Workspace Name', field: 'workspace_name', highlight: true },
          { title: 'Template Used', field: 'template' },
          { title: 'Status', field: 'status' },
          { title: 'Created Resource', field: 'pod' },
          { 
            title: 'Created on', 
            field: 'timestamp',
            render: (rowData: any) => rowData.timestamp 
              ? new Date(rowData.timestamp).toLocaleString() 
              : 'N/A'
          },
          { 
            title: 'Actions',
            render: (rowData: any) => (
              <>
                <IconButton
                  onClick={() => handleUpdate(rowData.workspace_name, rowData.template)}
                  color="primary" title="Update Workspace"
                >
                  <RefreshIcon />
                </IconButton>
                <IconButton
                  onClick={() => handleDelete(rowData.workspace_name)}
                  color="secondary" title="Delete Workspace"
                >
                  <DeleteIcon />
                </IconButton>
		<IconButton
                 onClick={() => handleDownloadConfig(rowData.workspace_name)}
                 color="default" title="Download Kubeconfig"
                >
                <GetAppIcon />
                </IconButton>
              </>
            ),
          },
        ]}
        options={{ paging: true, search: true }}
      />
    </div>
  );
};
