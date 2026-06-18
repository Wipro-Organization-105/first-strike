import React, { useState } from 'react';
import {
  Page,
  Content,
  Table,
} from '@backstage/core-components';
import type { TableColumn } from '@backstage/core-components';
import {
  IconButton,
  Box,
  Button,
  Menu,
  MenuItem,
  Typography,
} from '@mui/material';

import MoreVertIcon from '@mui/icons-material/MoreVert';
import DownloadIcon from '@mui/icons-material/Download';
import { useApi, fetchApiRef } from '@backstage/core-plugin-api';

type TemplateRow = {
  id: number;
  templateName: string;
  workspace: string;
};

export const WCDPage = () => {
  const fetchApi = useApi(fetchApiRef);

  // Mock data — replace with API later
  const templates: TemplateRow[] = [
    { id: 1, templateName: 'python-template',   workspace: 'python-workspace' },
    { id: 2, templateName: 'yokto-template', workspace: 'yokto-workspace' },
    // Add more rows here...
  ];

  // ---- Menu state for 3-dot "Actions" ----
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [menuRow, setMenuRow] = useState<TemplateRow | null>(null);
  const menuOpen = Boolean(menuAnchorEl);

  const onOpenMenu = (e: React.MouseEvent<HTMLElement>, row: TemplateRow) => {
    setMenuAnchorEl(e.currentTarget);
    setMenuRow(row);
  };
  const onCloseMenu = () => {
    setMenuAnchorEl(null);
    setMenuRow(null);
  };

  // ---- Actions hitting your backend plugin (adjust routes to yours) ----
  async function postAction(row: TemplateRow, action: 'start' | 'stop' | 'delete') {
    try {
      const method = action === 'delete' ? 'DELETE' : 'POST';
      // Example backend routes:
      //   POST    /api/wcd/workspaces/:id/start
      //   POST    /api/wcd/workspaces/:id/stop
      //   DELETE  /api/wcd/workspaces/:id/delete
      const resp = await fetchApi.fetch(`/api/wcd/workspaces/${row.id}/${action}`, { method });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      // TODO: refresh table state if needed
      console.log(`${action} OK for row ${row.id}`);
    } catch (e) {
      console.error(`Failed to ${action}:`, e);
    } finally {
      onCloseMenu();
    }
  }

/*  async function downloadIdeConfig(row: TemplateRow) {
    try {
      // Example: GET /api/wcd/ide-config/:id returns a file (json/zip)
      const resp = await fetchApi.fetch(`/api/wcd/ide-config/${row.id}`);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      // Change extension as per what your backend serves
      a.download = `${row.templateName}-ide-config.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Download failed:', e);
    }
  }*/
 async function downloadIdeConfig(row: TemplateRow) {
  try {
    // Your hardcoded JSON object
    const config = {
    "apiVersion": "v1",
    "clusters": [
        {
            "cluster": {
                "certificate-authority-data": "LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSUJkekNDQVIyZ0F3SUJBZ0lCQURBS0JnZ3Foa2pPUFFRREFqQWpNU0V3SHdZRFZRUUREQmhyTTNNdGMyVnkKZG1WeUxXTmhRREUzTnpBd01qRXlORGN3SGhjTk1qWXdNakF5TURnek5EQTNXaGNOTXpZd01UTXhNRGd6TkRBMwpXakFqTVNFd0h3WURWUVFEREJock0zTXRjMlZ5ZG1WeUxXTmhRREUzTnpBd01qRXlORGN3V1RBVEJnY3Foa2pPClBRSUJCZ2dxaGtqT1BRTUJCd05DQUFUR2NXUGk0MjFPZUlGNGNkUGNOUEtVRGdheERDYWlTaTBnTWNPeXV5a3EKS3dJRUdzUnlCYXVkLzhaQi91RDdNTTA2blhzK1hYRWs4bjFvVjJmNEJISVdvMEl3UURBT0JnTlZIUThCQWY4RQpCQU1DQXFRd0R3WURWUjBUQVFIL0JBVXdBd0VCL3pBZEJnTlZIUTRFRmdRVVZHREZkZThjaDNHcHpUdmlKa2l5CktpZVJEbk13Q2dZSUtvWkl6ajBFQXdJRFNBQXdSUUloQU5WN0IvbElVa0loZ25CRG1UMkZNMFgvUk00bDlDaUUKMTVHR3VreHZGZ0VtQWlBUVVYY0ZEZWtCZDl5OVJ2c0VaMkpKSXo2dW9aaGJwZndoU2duZmR6RjF1UT09Ci0tLS0tRU5EIENFUlRJRklDQVRFLS0tLS0K",
                "server": "https://ec2-65-1-145-172.ap-south-1.compute.amazonaws.com:6443"
            },
            "name": "default"
        }
    ],
    "contexts": [
        {
            "context": {
                "cluster": "default",
                "namespace": "dev-workspaces",
                "user": "developer-b"
            },
            "name": "default"
        }
    ],
    "current-context": "default",
    "kind": "Config",
    "users": [
        {
            "name": "developer-b",
            "user": {
                "token": "eyJhbGciOiJSUzI1NiIsImtpZCI6InpqdlpNcDkyVjhtaE1XN25iM0w0VUVEbDlqdk1XWHEwUDRCRzBSNmU2c0kifQ.eyJhdWQiOlsiaHR0cHM6Ly9rdWJlcm5ldGVzLmRlZmF1bHQuc3ZjLmNsdXN0ZXIubG9jYWwiLCJrM3MiXSwiZXhwIjoxODc5OTExMzQwLCJpYXQiOjE3NzE5MTEzNDAsImlzcyI6Imh0dHBzOi8va3ViZXJuZXRlcy5kZWZhdWx0LnN2Yy5jbHVzdGVyLmxvY2FsIiwianRpIjoiODc0MGY1MDktNzhmNi00MmM0LWFiOTItNTMyYmVjMmQwNDlmIiwia3ViZXJuZXRlcy5pbyI6eyJuYW1lc3BhY2UiOiJkZXYtd29ya3NwYWNlcyIsInNlcnZpY2VhY2NvdW50Ijp7Im5hbWUiOiJ3Y2Qtc2EiLCJ1aWQiOiI2NzllMTM1Zi02Y2I1LTQ4ZWItYjg0Zi04MzY3NzkyM2NjODkifX0sIm5iZiI6MTc3MTkxMTM0MCwic3ViIjoic3lzdGVtOnNlcnZpY2VhY2NvdW50OmRldi13b3Jrc3BhY2VzOndjZC1zYSJ9.iWpIm8s9t303T1fJQcrFZLkktzIggEofnfglloRxFRiFw0aDjWEEUXIiEDWyFisjIdKcap5uIHVhIfL-l2MYO3UNttDhMbJM0DBHKl56UScioRIIb7gEBAAunORey7tuqo_NY1qukkEcOFuAyYv1n52NyU_-pukkpwURVzKQQf7jQXBK-FIwanD1_Tp8ICtPLbJMqsYDsbyO8lT91Zmn9PRgOP1l_vRtGmp7PwgIcoEYW6aO6LQM0UIlDXvfvGL8VgVqOqwWi0XFYOLqQkqaan4ClF-DtxSSsnfZ34BlM2dZ4ZIe91uSBqOkBrE-zrW9gNcgRs-HKnTmLMpqqnun-w"
            }
        }
    ]
    };

    // Convert object to JSON string
    const jsonStr = JSON.stringify(config, null, 2);

    // Make a Blob so browser can download it
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    // Trigger download
    const a = document.createElement("a");
    a.href = url;
    a.download = `${row.templateName}-ide-config.json`; // file name
    document.body.appendChild(a);
    a.click();
    a.remove();

    // Clean up
    URL.revokeObjectURL(url);
  } catch (e) {
    console.error("Download failed:", e);
  }
}

  // ---- Table columns (note: IDE CONFIG column comes AFTER "ACTIONS") ----
  const columns: TableColumn<TemplateRow>[] = [
    { title: 'ID', field: 'id', width: '80px' },
    { title: 'TEMPLATE NAME', field: 'templateName' },
    { title: 'WORKSPACE NAME', field: 'workspace' },
    {
      title: 'ACTIONS',
      field: 'actions',
      sorting: false,
      width: '90px',
      render: row => (
        <IconButton
          size="small"
          aria-label="actions"
          onClick={(e) => onOpenMenu(e, row)}
        >
          <MoreVertIcon />
        </IconButton>
      ),
    },
    {
      title: 'IDE CONFIG',
      field: 'ideConfig',
      sorting: false,
/*      width: '160px', */
      render: row => (
        <Button
          size="medium"
         /* variant="outlined" */
          startIcon={<DownloadIcon/>}
          onClick={() => downloadIdeConfig(row)}
        ></Button>
      ),
    },
  ];

  return (
    <Page themeId="tool">
      {/* Header banner removed earlier; keeping a simple title */}
      <Content>
        <Box mb={2}>
          <Typography variant="h5" gutterBottom>
            WeCollab Templates &amp; Workspaces
          </Typography>
          {/* Filter & top Download button REMOVED as requested */}
        </Box>

        <Table
          title="WeCollab Templates"
          options={{
            paging: true,
            pageSize: 6,
            search: false,
            filtering: false,
            toolbar: false,   // hides toolbar (search/filter)
            padding: 'dense',
          }}
          columns={columns}
          data={templates}
        />

        {/* 3-dot actions menu */}
        <Menu
          anchorEl={menuAnchorEl}
          open={menuOpen}
          onClose={onCloseMenu}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        >
	
	{/* <MenuItem onClick={() => menuRow && postAction(menuRow, 'start')}>
            Start
          </MenuItem>
          <MenuItem onClick={() => menuRow && postAction(menuRow, 'stop')}>
            Stop
          </MenuItem>*/}
          <MenuItem
            onClick={() => menuRow && postAction(menuRow, 'delete')}
            sx={{ color: 'error.main' }}
          >
            Delete
          </MenuItem>
        </Menu>
      </Content>
    </Page>
  );
};
