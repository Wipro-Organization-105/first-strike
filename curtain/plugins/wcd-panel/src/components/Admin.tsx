import React, { useState } from 'react';
import { useApi, githubAuthApiRef, configApiRef, alertApiRef } from '@backstage/core-plugin-api';
import { Content, InfoCard, Progress, Table } from '@backstage/core-components';
// Added IconButton and Table to the imports
import { Grid, TextField, Button, MenuItem, Select, InputLabel, FormControl, Chip, IconButton } from '@material-ui/core';
import { useAsync, useAsyncRetry } from 'react-use';
import DeleteIcon from '@material-ui/icons/Delete';

export const Admin = () => {
  const configApi = useApi(configApiRef);
  const githubAuth = useApi(githubAuthApiRef);
  const alertApi = useApi(alertApiRef);
  const backendUrl = configApi.getString('backend.baseUrl');

  // --- 1. HOOKS (Must stay at the top) ---
  const [filename, setFilename] = useState('');
  const [folderName, setFolderName] = useState('');
  const [content, setContent] = useState('');
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [availableGroups, setAvailableGroups] = useState<string[]>([]);

  const { value: statusData, loading: loadingStatus, error: errorStatus } = useAsync(async () => {
    const token = await githubAuth.getAccessToken(['read:user']);
    const response = await fetch(`${backendUrl}/api/proxy/wcd-api/status`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Failed to fetch status');
    return response.json();
  }, []);

  const isAdmin = statusData?.user_groups?.includes('Wipro-Admins');

  useAsync(async () => {
    if (!isAdmin) return;
    const token = await githubAuth.getAccessToken(['read:user']);
    const response = await fetch(`${backendUrl}/api/proxy/wcd-api/admin/groups`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (response.ok) setAvailableGroups(await response.json());
  }, [isAdmin]);

  const { 
    value: allTemplates, 
    loading: loadingTemplates, 
    retry: reloadTemplates 
  } = useAsyncRetry(async () => {
    if (!isAdmin) return [];
    const token = await githubAuth.getAccessToken(['read:user']);
    const response = await fetch(`${backendUrl}/api/proxy/wcd-api/admin/all-templates`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.json();
  }, [isAdmin]);

  // --- 2. EARLY RETURNS ---
  if (loadingStatus) return <Progress />;
  if (errorStatus || !isAdmin) {
    return (
      <Content>
        <InfoCard title="Access Denied">
          <p>User: <b>{statusData?.current_user || 'Unknown'}</b></p>
          <p>You do not have permission to access this page.</p>
        </InfoCard>
      </Content>
    );
  }

  // --- 3. LOGIC HANDLERS ---
  const sanitizeName = (name: string) => name.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9._-]/g, '');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.tf')) {
        alertApi.post({ message: 'Only .tf files allowed', severity: 'error' });
        return;
      }
      setFilename(sanitizeName(file.name));
      const reader = new FileReader();
      reader.onload = (res) => setContent(res.target?.result as string);
      reader.readAsText(file);
    }
  };

  const handleSaveTemplate = async () => {
    let finalFilename = filename.trim();
    if (!finalFilename.endsWith('.tf')) finalFilename += '.tf';
    try {
      const token = await githubAuth.getAccessToken(['read:user']);
      await fetch(`${backendUrl}/api/proxy/wcd-api/admin/templates`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: sanitizeName(finalFilename),
          content,
          folder_name: sanitizeName(folderName),
          groups: selectedGroups,
        }),
      });
      alertApi.post({ message: 'Template saved!', severity: 'success' });
      setFilename(''); setFolderName(''); setContent(''); setSelectedGroups([]);
      reloadTemplates();
    } catch (e: any) {
      alertApi.post({ message: e.message, severity: 'error' });
    }
  };

  const deleteTemplate = async (fname: string, folder: string) => {
    if (!window.confirm(`Delete ${fname} from ${folder} folder?`)) return;
    try {
      const token = await githubAuth.getAccessToken(['read:user']);
      const query = new URLSearchParams({ filename: fname, folder_name: folder }).toString();
      await fetch(`${backendUrl}/api/proxy/wcd-api/admin/templates?${query}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      alertApi.post({ message: 'Deleted successfully', severity: 'success' });
      reloadTemplates();
    } catch (e: any) {
      alertApi.post({ message: e.message, severity: 'error' });
    }
  };

  // --- 4. RENDER ---
  return (
    <Content>
      <Grid container spacing={3}>
        {/* Row 1: The Form */}
        <Grid item xs={12}>
          <InfoCard title="Upload & Assign Terraform Template">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <Button variant="contained" component="label">
                Upload .tf File
                <input type="file" hidden accept=".tf" onChange={handleFileUpload} />
              </Button>
              <TextField label="Folder Name" value={folderName} onChange={(e) => setFolderName(sanitizeName(e.target.value))} fullWidth />
              <TextField label="Template Filename" value={filename} onChange={(e) => setFilename(sanitizeName(e.target.value))} fullWidth />
              <TextField label="Terraform Code Editor" multiline rows={8} variant="outlined" value={content} onChange={(e) => setContent(e.target.value)} fullWidth />
              <FormControl fullWidth>
                <InputLabel>Assign to User Groups</InputLabel>
                <Select
                  multiple value={selectedGroups}
                  onChange={(e) => setSelectedGroups(e.target.value as string[])}
                  renderValue={(selected) => (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                      {(selected as string[]).map((v) => <Chip key={v} label={v} size="small" />)}
                    </div>
                  )}
                >
                  {availableGroups.map((name) => <MenuItem key={name} value={name}>{name}</MenuItem>)}
                </Select>
              </FormControl>
              <Button variant="contained" color="primary" onClick={handleSaveTemplate}>Save Template</Button>
            </div>
          </InfoCard>
        </Grid>

        {/* Row 2: The List (Separate Grid Item) */}
        <Grid item xs={12}>
          <Table
            title="Managed Terraform Templates"
            options={{ paging: true, search: true }}
            data={allTemplates || []}
            isLoading={loadingTemplates}
            columns={[
              { title: 'Folder', field: 'folder' },
              { title: 'Filename', field: 'filename', highlight: true },
              {
                title: 'Actions',
                render: (row: any) => (
                  <IconButton color="secondary" onClick={() => deleteTemplate(row.filename, row.folder)}>
                    <DeleteIcon />
                  </IconButton>
                ),
              },
            ]}
          />
        </Grid>
      </Grid>
    </Content>
  );
};
