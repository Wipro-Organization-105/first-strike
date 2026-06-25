import React, { useEffect,useMemo, useState } from 'react';
import {
  useApi,
  discoveryApiRef,
  fetchApiRef,
} from '@backstage/core-plugin-api';
import {
  Progress,
  ResponseErrorPanel,
  InfoCard,
} from '@backstage/core-components';
import {
  Grid,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
} from '@material-ui/core';



type WorkItem = {
  id: number;
  title: string;
  workItemType: string;
  state: string;
  assignedTo?: string;
  iteration?: string;
  team?: string;
  changedDate?: string;
  webUrl?: string;
};


type SummaryResponse = {
  lastUpdated?: string;
  total: number;
  byState: Record<string, number>;
  byAssignee: Record<string, number>;
  byIteration?: Record<string, number>;
  byAreaPath?: Record<string, number>;
  byWorkItemType?: Record<string, number>;
  items?: WorkItem[];
};

export const TaskMonitoringPage = () => {
  const discoveryApi = useApi(discoveryApiRef);
  const fetchApi = useApi(fetchApiRef);

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<SummaryResponse | null>(null);
  const [error, setError] = useState<Error | undefined>(undefined);

  const [selectedAreaPath, setSelectedAreaPath] = useState<string>('');
  const [selectedIteration, setSelectedIteration] = useState<string>('');
  const [selectedAssignee, setSelectedAssignee] = useState<string>('');
  const [selectedStateFilter, setSelectedStateFilter] = useState<string>('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('');


  useEffect(() => {
    const load = async () => {
      try {
        const baseUrl = await discoveryApi.getBaseUrl('az-task-monitoring-backend');
        const response = await fetchApi.fetch(`${baseUrl}/summary`);

        if (!response.ok) {
          throw new Error(`Failed to fetch summary: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();
        setData(result);
      } catch (e) {
        setError(e as Error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [discoveryApi, fetchApi]);

  const items = data?.items || []


  const areaPathOptions = useMemo(() => {
    return Array.from(
      new Set(
        items
          .map(item => item.team)
          .filter((value): value is string => Boolean(value))
      )
    ).sort();
  }, [items]);


/*  const areaFilteredItems = useMemo(() => {
    return items.filter(item => {
      return !selectedAreaPath || item.areaPath === selectedAreaPath;
    });
  }, [items, selectedAreaPath]);*/


  const iterationOptions = useMemo(() => {
	  return Array.from(
      new Set(
        items
          .map(item => item.iteration)
          .filter((value): value is string => Boolean(value))
      )
    ).sort();
  }, [items]);


  const assigneeOptions = useMemo(() => {
    
    const sourceItems = selectedAreaPath
    ? items.filter(item => item.team === selectedAreaPath)
    : items;

    return Array.from(
      new Set(
	sourceItems
          .map(item => item.assignedTo)
          .filter((value): value is string => Boolean(value))
      )
    ).sort();
  }, [items, selectedAreaPath]);


  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesAreaPath =
        !selectedAreaPath || item.team === selectedAreaPath;


      const matchesIteration =
        !selectedIteration || item.iteration === selectedIteration;

      const matchesAssignee =
        !selectedAssignee || item.assignedTo === selectedAssignee;


      return matchesAreaPath && matchesIteration && matchesAssignee;
    });
  }, [items, selectedAreaPath, selectedIteration, selectedAssignee]);



  const stateFilterOptions = useMemo(() => {
    return Array.from(
      new Set(
        filteredItems
          .map(item => item.state)
          .filter((value): value is string => Boolean(value))
      )  
    ).sort();
  }, [filteredItems]);

  
  const typeFilterOptions = useMemo(() => {
    return Array.from(
      new Set(
        filteredItems
          .map(item => item.workItemType)
          .filter((value): value is string => Boolean(value))
      )
    ).sort();
  }, [filteredItems])


  const tableFilteredItems = useMemo(() => {
    return filteredItems.filter(item => {
      const matchesState =
        !selectedStateFilter || item.state === selectedStateFilter;

      const matchesType =
        !selectedTypeFilter || item.workItemType === selectedTypeFilter;

      return matchesState && matchesType;
    });
  }, [filteredItems, selectedStateFilter, selectedTypeFilter]);



  const clearTableFilters = () => {
    setSelectedStateFilter('');
    setSelectedTypeFilter('');
  };




  useEffect(() => {
    if (
      selectedAssignee &&
      !assigneeOptions.includes(selectedAssignee)
    ) {
      setSelectedAssignee('');
    }
  }, [selectedAssignee, assigneeOptions]);


  const filteredByState = useMemo(() => {
    const result: Record<string, number> = {};
    for (const item of filteredItems) {
      const key = item.state || 'Unknown';
      result[key] = (result[key] || 0) + 1;
    }
    return result;
  }, [filteredItems]);


  /*const filteredByAssignee = useMemo(() => {
    const result: Record<string, number> = {};
    for (const item of filteredItems) {
      const key = item.assignedTo || 'Unassigned';
      result[key] = (result[key] || 0) + 1;
    }
    return result;
  }, [filteredItems]);*/


  /*const stateEntries = Object.entries(filteredByState).sort((a, b) => b[1] - a[1]);
  const assigneeEntries = Object.entries(filteredByAssignee).sort((a, b) => b[1] - a[1]);*/

  const clearFilters = () => {
    setSelectedAreaPath('');
    setSelectedIteration('');
    setSelectedAssignee('');
  };

  if (loading) {
    return <Progress />;
  }

  if (error) {
    return <ResponseErrorPanel error={error} />;
  }

  if (!data) {
    return <Typography>No data available</Typography>;
  }

  const stateEntries = Object.entries(filteredByState || {}).sort((a, b) => b[1] - a[1]);
  //const assigneeEntries = Object.entries(data.byAssignee || {}).sort((a, b) => b[1] - a[1]);
  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h4">Azure Task Monitoring</Typography>
        <Typography variant="body2" color="textSecondary">
          Last updated: {data.lastUpdated || '-'}
        </Typography>
      </Grid>

      {/* Filters */}
      <Grid item xs={12} md={3}>
        <FormControl variant="outlined" fullWidth size="small">
          <InputLabel id="area-path-label">Team</InputLabel>
          <Select
            labelId="area-path-label"
            value={selectedAreaPath}
            onChange={e => setSelectedAreaPath(e.target.value as string)}
            label="Team"
          >
            <MenuItem value="">
              <em>All Teams</em>
            </MenuItem>
            {areaPathOptions.map(team => (
              <MenuItem key={team} value={team}>
                {team}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>

      <Grid item xs={12} md={3}>
        <FormControl variant="outlined" fullWidth size="small">
          <InputLabel id="iteration-label">Sprint</InputLabel>
          <Select
            labelId="iteration-label"
            value={selectedIteration}
            onChange={e => setSelectedIteration(e.target.value as string)}
            label="Iteration"
          >
            <MenuItem value="">
              <em>All Sprints</em>
            </MenuItem>
            {iterationOptions.map(iteration => (
              <MenuItem key={iteration} value={iteration}>
                {iteration}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>

      <Grid item xs={12} md={3}>
        <FormControl variant="outlined" fullWidth size="small">
          <InputLabel id="assignee-label">Assignee</InputLabel>
          <Select
            labelId="assignee-label"
            value={selectedAssignee}
            onChange={e => setSelectedAssignee(e.target.value as string)}
            label="Assignee"
          >
            <MenuItem value="">
              <em>All Assignees</em>
            </MenuItem>
            {assigneeOptions.map(assignee => (
              <MenuItem key={assignee} value={assignee}>
                {assignee}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>

      <Grid item xs={12} md={3} style={{ display: 'flex', alignItems: 'center' }}>
        <Typography
          variant="body2"
          style={{ cursor: 'pointer', fontWeight: 600 }}
          onClick={clearFilters}
        >
          Clear Filters
        </Typography>
      </Grid>

      {/* Summary cards */}
      <Grid item xs={12} md={4}>
        <InfoCard title="Total Work Items">
          <Typography variant="h4">{filteredItems.length}</Typography>
        </InfoCard>
      </Grid>

      <Grid item xs={12} md={4}>
        <InfoCard title="States">
          {stateEntries.length > 0 ? (
            stateEntries.map(([state, count]) => (
              <Typography key={state} variant="body2">
                {state}: {count}
              </Typography>
            ))
          ) : (
            <Typography variant="body2">No data</Typography>
          )}
        </InfoCard>
      </Grid>

      {/*<Grid item xs={12} md={4}>
        <InfoCard title="Top Assignees">
          {assigneeEntries.length > 0 ? (
            assigneeEntries.slice(0, 10).map(([name, count]) => (
              <Typography key={name} variant="body2">
                {name}: {count}
              </Typography>
            ))
          ) : (
            <Typography variant="body2">No data</Typography>
          )}
        </InfoCard>
      </Grid>*/}

      {/* Work items table */}
      <Grid item xs={12}>
        <InfoCard title="Work Items">
            <Grid container spacing={2} style={{ marginBottom: 12 }}>
            <Grid item xs={12} md={3}>
                <FormControl variant="outlined" fullWidth size="small">
                <InputLabel id="table-state-filter-label">State</InputLabel>
                <Select
                    labelId="table-state-filter-label"
                    value={selectedStateFilter}
                    onChange={e => setSelectedStateFilter(e.target.value as string)}
                    label="State"
                >
                    <MenuItem value="">
                    <em>All States</em>
                    </MenuItem>
                    {stateFilterOptions.map(state => (
                    <MenuItem key={state} value={state}>
                        {state}
                    </MenuItem>
                    ))}
                </Select>
                </FormControl>
            </Grid>

            <Grid item xs={12} md={3}>
                <FormControl variant="outlined" fullWidth size="small">
                <InputLabel id="table-type-filter-label">Type</InputLabel>
                <Select
                    labelId="table-type-filter-label"
                    value={selectedTypeFilter}
                    onChange={e => setSelectedTypeFilter(e.target.value as string)}
                    label="Type"
                >
                    <MenuItem value="">
                    <em>All Types</em>
                    </MenuItem>
                    {typeFilterOptions.map(type => (
                    <MenuItem key={type} value={type}>
                        {type}
                    </MenuItem>
                    ))}
                </Select>
                </FormControl>
            </Grid>

            <Grid item xs={12} md={3} style={{ display: 'flex', alignItems: 'center' }}>
                <Typography
                variant="body2"
                style={{ cursor: 'pointer', fontWeight: 600 }}
                onClick={clearTableFilters}
                >
                Clear Table Filters
                </Typography>
            </Grid>
            </Grid>

            <Paper elevation={0} style={{ overflowX: 'auto' }}>
            <Table size="small">
                <TableHead>
                <TableRow>
                    <TableCell style={{ whiteSpace: 'nowrap', width: 70 }}>ID</TableCell>
                    <TableCell style={{ minWidth: 320 }}>Title</TableCell>
                    <TableCell style={{ whiteSpace: 'nowrap', width: 120 }}>Type</TableCell>
                    <TableCell style={{ whiteSpace: 'nowrap', width: 100 }}>State</TableCell>
                    <TableCell style={{ whiteSpace: 'nowrap', width: 160 }}>Assigned To</TableCell>
                    <TableCell style={{ minWidth: 220 }}>Iteration</TableCell>
                    <TableCell style={{ minWidth: 220 }}>Team</TableCell>
                    <TableCell style={{ whiteSpace: 'nowrap', width: 100 }}>ADO Link</TableCell>
                </TableRow>
                </TableHead>
                <TableBody>
                {tableFilteredItems.slice(0, 100).map(item => (
                    <TableRow key={item.id}>
                    <TableCell style={{ whiteSpace: 'nowrap' }}>{item.id}</TableCell>
                    <TableCell style={{ wordBreak: 'break-word', maxWidth: 360 }}>{item.title}</TableCell>
                    <TableCell style={{ whiteSpace: 'nowrap' }}>{item.workItemType}</TableCell>
                    <TableCell style={{ whiteSpace: 'nowrap' }}>{item.state}</TableCell>
                    <TableCell style={{ whiteSpace: 'nowrap' }}>{item.assignedTo || '-'}</TableCell>
                    <TableCell style={{ wordBreak: 'break-word', maxWidth: 220 }}>{item.iteration || '-'}</TableCell>
                    <TableCell style={{ wordBreak: 'break-word', maxWidth: 220 }}>{item.team || '-'}</TableCell>
                    <TableCell style={{ whiteSpace: 'nowrap' }}>
                        {item.webUrl ? (
                        <a
                            href={item.webUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: '#1976d2', fontWeight: 600, textDecoration: 'none' }}
                        >
                            Open
                        </a>
                        ) : (
                        '-'
                        )}
                    </TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
            </Paper>
        </InfoCard>
        </Grid>
      {/*<Grid item xs={12}>
        <InfoCard title="Work Items">
          <Paper elevation={0}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Title</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>State</TableCell>
                  <TableCell>Assigned To</TableCell>
                  <TableCell>Iteration</TableCell>
                  <TableCell>Area Path</TableCell>
		  <TableCell>ADO Link</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredItems.slice(0, 100).map(item => (
                  <TableRow key={item.id}>
                    <TableCell>{item.id}</TableCell>
                    <TableCell>{item.title}</TableCell>
                    <TableCell>{item.workItemType}</TableCell>
                    <TableCell>{item.state}</TableCell>
                    <TableCell>{item.assignedTo || '-'}</TableCell>
                    <TableCell>{item.iterationPath || '-'}</TableCell>
                    <TableCell>{item.areaPath || '-'}</TableCell>
                    <TableCell>{item.webUrl ? (<a
                                   href={item.webUrl}
                                   target="_blank"
                                   rel="noopener noreferrer"
                                   style={{ color: '#1976d2', fontWeight: 600, textDecoration: 'none' }}
				 >
                                   Open
                                 </a>) : ( '-' )}
		    </TableCell>

                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        </InfoCard>
      </Grid>*/}

    </Grid>
  );
 /* return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h4">Azure Task Monitoring</Typography>
        <Typography variant="body2" color="textSecondary">
          Last updated: {data.lastUpdated || '-'}
        </Typography>
      </Grid>

      <Grid item xs={12} md={4}>
        <InfoCard title="Total Work Items">
          <Typography variant="h4">{data.total}</Typography>
        </InfoCard>
      </Grid>

      <Grid item xs={12} md={4}>
        <InfoCard title="States">
          {stateEntries.map(([state, count]) => (
            <Typography key={state} variant="body2">
              {state}: {count}
            </Typography>
          ))}
        </InfoCard>
      </Grid>

      <Grid item xs={12} md={4}>
        <InfoCard title="Top Assignees">
          {assigneeEntries.slice(0, 10).map(([name, count]) => (
            <Typography key={name} variant="body2">
              {name}: {count}
            </Typography>
          ))}
        </InfoCard>
      </Grid>

      <Grid item xs={12}>
        <InfoCard title="Work Items">
          <Paper elevation={0}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Title</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>State</TableCell>
                  <TableCell>Assigned To</TableCell>
                  <TableCell>Iteration</TableCell>
                  <TableCell>Area Path</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(data.items || []).slice(0, 50).map(item => (
                  <TableRow key={item.id}>
                    <TableCell>{item.id}</TableCell>
                    <TableCell>{item.title}</TableCell>
                    <TableCell>{item.workItemType}</TableCell>
                    <TableCell>{item.state}</TableCell>
                    <TableCell>{item.assignedTo || '-'}</TableCell>
                    <TableCell>{item.iterationPath || '-'}</TableCell>
                    <TableCell>{item.areaPath || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        </InfoCard>
      </Grid>
    </Grid>
  );*/

};
