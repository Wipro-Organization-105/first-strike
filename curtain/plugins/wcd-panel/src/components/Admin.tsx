import React, { useState, useEffect } from 'react';
import { useApi, githubAuthApiRef, configApiRef, alertApiRef } from '@backstage/core-plugin-api';
import { Content, InfoCard, Progress, ResponseErrorPanel } from '@backstage/core-components';
import { Grid, TextField, Button, MenuItem, Select, InputLabel, FormControl, Chip } from '@material-ui/core';
import { useAsync, useAsyncRetry } from 'react-use';

export const Admin = () => {
  const configApi = useApi(configApiRef);
  const githubAuth = useApi(githubAuthApiRef);
  const alertApi = useApi(alertApiRef);
  const backendUrl = configApi.getString('backend.baseUrl');

  const [filename, setFilename] = useState('');
  const [folderName, setFolderName] = useState('');
  const [content, setContent] = useState('');
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [availableGroups, setAvailableGroups] = useState<string[]>([]); 
  const { value: statusData, loading, error } = useAsync(async () => {
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
    if (response.ok) {
      setAvailableGroups(await response.json());
    }
  }, [isAdmin]);
  if (loading) return <Progress />;

  if (error||!isAdmin) {
    return (
      <Content>
        <InfoCard title="Access Denied">
	  <p><b>{statusData?.current_user || 'Unknown'}</b></p>
          <p>You do not have permission to access this page. Please contact a Wipro-Admin.</p>
        </InfoCard>
      </Content>
    );
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFilename(file.name);
      const reader = new FileReader();
      reader.onload = (res) => setContent(res.target?.result as string);
      reader.readAsText(file);
    }
  };

  const handleSaveTemplate = async () => {
    try {
      const token = await githubAuth.getAccessToken(['read:user']);
      const response = await fetch(`${backendUrl}/api/proxy/wcd-api/admin/templates`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({
          filename,
          content,
	  folder_name: folderName,
          groups: selectedGroups,
        }),
      });

      if (!response.ok) throw new Error('Failed to save template and mappings');
      alertApi.post({ message: 'Template saved and groups assigned!', severity: 'success' });
    } catch (e: any) {
      alertApi.post({ message: e.message, severity: 'error' });
    }
  };

  return (
    <Content>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <InfoCard title="Upload & Assign Terraform Template">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <Button variant="contained" component="label">
                Upload .tf File
                <input type="file" hidden accept=".tf" onChange={handleFileUpload} />
              </Button>

              <TextField
                label="Folder Name"
                placeholder="e.g., Yocto android or ADAS etc."
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                fullWidth
              />

              <TextField
                label="Template Filename"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                fullWidth
              />

              <TextField
                label="Terraform Code Editor"
                multiline
                rows={10}
                variant="outlined"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                fullWidth
              />

              <FormControl fullWidth>
                <InputLabel>Assign to User Groups (Multi-Select)</InputLabel>
                <Select
                  multiple
                  value={selectedGroups}
                  onChange={(e) => setSelectedGroups(e.target.value as string[])}
                  renderValue={(selected) => (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                      {(selected as string[]).map((value) => (
                        <Chip key={value} label={value} />
                      ))}
                    </div>
                  )}
                >
                  {availableGroups.map((name) => (
                    <MenuItem key={name} value={name}>{name}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Button variant="contained" color="primary" onClick={handleSaveTemplate}>
                Save Template & Update Mappings
              </Button>
            </div>
          </InfoCard>
        </Grid>
      </Grid>
    </Content>
  );
};
