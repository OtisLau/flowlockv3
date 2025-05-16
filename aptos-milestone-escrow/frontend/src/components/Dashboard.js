import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { Button, Card, Tabs, Tag, List, Typography, Empty, Spin, Alert } from 'antd';
import {
  PlusOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  ReloadOutlined
} from '@ant-design/icons';

import {
  getClientEscrows,
  getFreelancerEscrows,
  getOpenEscrows,
  getEscrowDetails,
  getEscrowStatusText,
  formatAptAmount,
} from '../utils/contractUtils';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

function Dashboard() {
  const { account } = useWallet();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [clientEscrows, setClientEscrows] = useState([]);
  const [freelancerEscrows, setFreelancerEscrows] = useState([]);
  const [openEscrows, setOpenEscrows] = useState([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Function to manually refresh data
  const refreshData = () => {
    console.log("Manually refreshing dashboard data");
    setRefreshTrigger(prev => prev + 1);
  };

  // Load user escrows on component mount or when refreshed
  useEffect(() => {
    const fetchEscrows = async () => {
      if (!account) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      setError(null);
      try {
        console.log("Fetching escrows for account:", account.address);
        
        // Get escrow IDs
        const clientEscrowIds = await getClientEscrows(account.address);
        const freelancerEscrowIds = await getFreelancerEscrows(account.address);
        const allOpenEscrowIds = await getOpenEscrows();
        
        console.log("Client escrow IDs:", clientEscrowIds);
        console.log("Freelancer escrow IDs:", freelancerEscrowIds);
        console.log("Open escrow IDs:", allOpenEscrowIds);
        
        // Get escrow details
        const clientEscrowPromises = clientEscrowIds.map(id => getEscrowDetails(id));
        const freelancerEscrowPromises = freelancerEscrowIds.map(id => getEscrowDetails(id));
        const openEscrowPromises = allOpenEscrowIds.map(id => getEscrowDetails(id));
        
        const [clientDetails, freelancerDetails, openDetails] = await Promise.all([
          Promise.all(clientEscrowPromises),
          Promise.all(freelancerEscrowPromises),
          Promise.all(openEscrowPromises),
        ]);
        
        // Process client escrows
        const validClientEscrows = clientEscrowIds.map((id, index) => {
          const details = clientDetails[index];
          return details ? { id, ...details } : null;
        }).filter(Boolean);
        
        // Process freelancer escrows
        const validFreelancerEscrows = freelancerEscrowIds.map((id, index) => {
          const details = freelancerDetails[index];
          return details ? { id, ...details } : null;
        }).filter(Boolean);
        
        // Process open escrows (only those not created by this user and still open)
        const validOpenEscrows = allOpenEscrowIds.map((id, index) => {
          const details = openDetails[index];
          if (details && details.status === 0 && details.client !== account.address) {
            return { id, ...details };
          }
          return null;
        }).filter(Boolean);
        
        console.log("Valid client escrows:", validClientEscrows);
        console.log("Valid freelancer escrows:", validFreelancerEscrows);
        console.log("Valid open escrows:", validOpenEscrows);
        
        setClientEscrows(validClientEscrows);
        setFreelancerEscrows(validFreelancerEscrows);
        setOpenEscrows(validOpenEscrows);
      } catch (error) {
        console.error('Error fetching escrows:', error);
        setError("Failed to load escrows. Please try refreshing.");
      } finally {
        setLoading(false);
      }
    };

    fetchEscrows();
  }, [account, refreshTrigger]);

  // Status badge for escrows
  const getStatusBadge = (status) => {
    const statusText = getEscrowStatusText(status);
    switch (status) {
      case 0: // Open
        return <Tag color="blue">{statusText}</Tag>;
      case 1: // In Progress
        return <Tag color="processing">{statusText}</Tag>;
      case 2: // Completed
        return <Tag color="success">{statusText}</Tag>;
      case 3: // Cancelled
        return <Tag color="error">{statusText}</Tag>;
      case 4: // Disputed
        return <Tag color="warning">{statusText}</Tag>;
      default:
        return <Tag>{statusText}</Tag>;
    }
  };

  // Render escrow card
  const renderEscrowCard = (escrow) => (
    <Card 
      className="escrow-card"
      title={escrow.title}
      extra={getStatusBadge(escrow.status)}
      key={escrow.id}
      hoverable
      onClick={() => navigate(`/escrow/${escrow.id}`)}
    >
      <Paragraph ellipsis={{ rows: 2 }}>{escrow.description}</Paragraph>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px' }}>
        <Text><DollarOutlined /> {formatAptAmount(escrow.totalAmount)}</Text>
        <Text>
          <ClockCircleOutlined /> Created: {new Date(escrow.createdAt * 1000).toLocaleDateString()}
        </Text>
      </div>
    </Card>
  );

  // If no wallet is connected
  if (!account) {
    return (
      <div className="dashboard">
        <Title level={2}>Milestone Escrow Dashboard</Title>
        <Alert
          message="Wallet Not Connected"
          description="Please connect your Aptos wallet to view your escrows and available projects."
          type="info"
          showIcon
          style={{ marginBottom: '20px' }}
        />
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Title level={2} style={{ marginRight: '16px', marginBottom: 0 }}>Escrow Dashboard</Title>
          <Button 
            icon={<ReloadOutlined />} 
            onClick={refreshData}
            loading={loading}
          >
            Refresh
          </Button>
        </div>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          size="large"
          onClick={() => navigate('/create')}
        >
          Create New Escrow
        </Button>
      </div>

      {error && (
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          closable
          style={{ marginBottom: '20px' }}
        />
      )}

      <Tabs defaultActiveKey="1" className="dashboard-tabs">
        <TabPane tab="As Client" key="1">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <Spin size="large" />
            </div>
          ) : clientEscrows.length > 0 ? (
            <List
              grid={{
                gutter: 16,
                xs: 1,
                sm: 1,
                md: 2,
                lg: 3,
                xl: 3,
                xxl: 4,
              }}
              dataSource={clientEscrows}
              renderItem={renderEscrowCard}
            />
          ) : (
            <Empty 
              description="You haven't created any escrows yet" 
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            >
              <Button type="primary" onClick={() => navigate('/create')}>
                Create Your First Escrow
              </Button>
            </Empty>
          )}
        </TabPane>
        
        <TabPane tab="As Freelancer" key="2">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <Spin size="large" />
            </div>
          ) : (
            <>
              {/* Show freelancer's active escrows */}
              {freelancerEscrows.length > 0 && (
                <>
                  <Title level={4} style={{ marginBottom: '16px' }}>Your Current Projects</Title>
                  <List
                    grid={{
                      gutter: 16,
                      xs: 1,
                      sm: 1,
                      md: 2,
                      lg: 3,
                      xl: 3,
                      xxl: 4,
                    }}
                    dataSource={freelancerEscrows}
                    renderItem={renderEscrowCard}
                    style={{ marginBottom: '32px' }}
                  />
                </>
              )}
              
              {/* Show available opportunities */}
              <Title level={4} style={{ marginBottom: '16px' }}>Available Opportunities</Title>
              {openEscrows.length > 0 ? (
                <List
                  grid={{
                    gutter: 16,
                    xs: 1,
                    sm: 1,
                    md: 2,
                    lg: 3,
                    xl: 3,
                    xxl: 4,
                  }}
                  dataSource={openEscrows}
                  renderItem={renderEscrowCard}
                />
              ) : (
                <Empty 
                  description="No open opportunities available right now" 
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              )}
            </>
          )}
        </TabPane>
      </Tabs>
    </div>
  );
}

export default Dashboard; 