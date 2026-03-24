import React from 'react';
import { Page, Header, HeaderLabel, Content, TabbedLayout } from '@backstage/core-components';
import { Dashboard } from '../Dashboard'; 
import { Admin } from '../Admin';         

export const ExampleComponent = () => {
  return (
    <Page themeId="tool">
      <Header title="WeCollaborate Infrastructure management" subtitle="Containerized Development Environment">
        <HeaderLabel label="Owner" value="Platform Team" />
        <HeaderLabel label="Lifecycle" value="Production" />
      </Header>
      
      <TabbedLayout>
        <TabbedLayout.Route path="/" title="Dashboard">
          <Content>
            <Dashboard />
          </Content>
        </TabbedLayout.Route>
        
        <TabbedLayout.Route path="/admin" title="Administration">
          <Admin />
        </TabbedLayout.Route>
      </TabbedLayout>
    </Page>
  );
};
