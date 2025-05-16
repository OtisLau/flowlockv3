import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Layout, Typography } from 'antd';
import { WalletSelector } from '@aptos-labs/wallet-adapter-ant-design';
import '@aptos-labs/wallet-adapter-ant-design/dist/index.css';

// Import pages
import Dashboard from './components/Dashboard';
import CreateEscrow from './components/CreateEscrow';
import EscrowDetails from './components/EscrowDetails';

const { Header, Content, Footer } = Layout;
const { Title } = Typography;

function App() {
  return (
    <Layout className="layout" style={{ minHeight: '100vh' }}>
      <Header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Title level={3} style={{ color: 'white', margin: 0 }}>
          Aptos Milestone Escrow
        </Title>
        <WalletSelector />
      </Header>
      
      <Content style={{ padding: '24px 50px' }}>
        <div className="site-layout-content" style={{ padding: 24, minHeight: 380 }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/create" element={<CreateEscrow />} />
            <Route path="/escrow/:id" element={<EscrowDetails />} />
          </Routes>
        </div>
      </Content>
      
      <Footer style={{ textAlign: 'center' }}>
        Aptos Milestone Escrow ©{new Date().getFullYear()} - Securely manage freelance projects with blockchain escrow
      </Footer>
    </Layout>
  );
}

export default App; 