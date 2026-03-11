import React from 'react';
import { Grid } from '@material-ui/core';
import { InfoCard, Content, Header, Page, pageTheme } from '@backstage/core-components';

export const Admin = () => {
  return (
    <Content>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <InfoCard title="User & Group Mapping">
            {/* Add JSON editor or Table here later */}
            <p>Manage user-group-mapping.json here.</p>
          </InfoCard>
        </Grid>
        <Grid item xs={12} md={6}>
          <InfoCard title="Template Management">
            {/* Add File Upload / Delete Logic here */}
            <p>Create or delete .tf templates here.</p>
          </InfoCard>
        </Grid>
      </Grid>
    </Content>
  );
};

