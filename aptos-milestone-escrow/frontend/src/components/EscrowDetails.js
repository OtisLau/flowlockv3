import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { 
  Card, 
  Typography, 
  Button, 
  Tag, 
  Descriptions, 
  Divider, 
  Empty, 
  Spin, 
  Modal, 
  message, 
  Progress,
  Collapse,
  Alert,
  Input
} from 'antd';
import { 
  CheckCircleOutlined, 
  RollbackOutlined, 
  ExclamationCircleOutlined,
  ArrowLeftOutlined,
  UserOutlined,
  DollarOutlined,
  ReloadOutlined
} from '@ant-design/icons';

import {
  getEscrowDetails,
  getMilestoneDetails,
  getMilestoneCount,
  getEscrowStatusText,
  getMilestoneStatusText,
  formatAptAmount,
  acceptEscrow,
  completeMilestone,
  cancelEscrow,
  createDispute,
} from '../utils/contractUtils';

const { Title, Paragraph } = Typography;
const { Panel } = Collapse;
const { confirm } = Modal;

function EscrowDetails() {
  const navigate = useNavigate();
  const { id: escrowId } = useParams();
  const { account, signAndSubmitTransaction } = useWallet();
  const [loading, setLoading] = useState(true);
  const [escrow, setEscrow] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Function to manually refresh data
  const refreshData = () => {
    console.log("Manually refreshing escrow details");
    setRefreshTrigger(prev => prev + 1);
  };

  // Fetch escrow details
  useEffect(() => {
    const fetchEscrowDetails = async () => {
      if (!escrowId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        console.log("Fetching details for escrow ID:", escrowId);
        
        // Get escrow details
        const details = await getEscrowDetails(escrowId);
        console.log("Received escrow details:", details);
        
        if (details) {
          setEscrow({ id: escrowId, ...details });

          // Get milestone count and details
          const count = await getMilestoneCount(escrowId);
          console.log("Milestone count:", count);
          
          if (count > 0) {
            console.log("Fetching details for", count, "milestones");
            const milestonePromises = [];
            for (let i = 0; i < count; i++) {
              console.log("Fetching milestone", i);
              milestonePromises.push(getMilestoneDetails(escrowId, i));
            }
            const milestoneDetails = await Promise.all(milestonePromises);
            console.log("Raw milestone details:", milestoneDetails);
            
            // Add index to each milestone and filter out null values
            const validMilestones = milestoneDetails
              .map((milestone, index) => {
                console.log("Processing milestone", index, ":", milestone);
                return milestone ? { ...milestone, index } : null;
              })
              .filter(Boolean);
            
            console.log("Final processed milestones:", validMilestones);
            setMilestones(validMilestones);
          } else {
            console.log("No milestones found for escrow");
            setMilestones([]);
          }
        } else {
          setError("Could not load escrow details. The escrow may not exist.");
        }
      } catch (error) {
        console.error('Error fetching escrow details:', error);
        setError('Failed to load escrow details: ' + error.message);
        message.error('Failed to load escrow details');
      } finally {
        setLoading(false);
      }
    };

    fetchEscrowDetails();
  }, [escrowId, refreshTrigger]);

  // Handle accepting an escrow as a freelancer
  const handleAcceptEscrow = async () => {
    if (!account || !escrow) return;

    confirm({
      title: 'Accept this project?',
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          <p>You will be accepting this project as the freelancer.</p>
          <p>The client will be able to release funds to you as milestones are completed.</p>
        </div>
      ),
      onOk: async () => {
        setProcessing(true);
        try {
          console.log("Accepting escrow with ID:", escrowId);
          
          await acceptEscrow({
            signer: { 
              account,
              signAndSubmitTransaction 
            },
            escrowId
          });
          
          message.success('You have successfully accepted this project!');
          setTimeout(() => {
            refreshData();
          }, 2000);
        } catch (error) {
          console.error('Error accepting escrow:', error);
          message.error('Failed to accept project: ' + error.message);
        } finally {
          setProcessing(false);
        }
      },
    });
  };

  // Handle completion of a milestone (client approves)
  const handleCompleteMilestone = async (milestoneIndex) => {
    if (!account || !escrow) return;

    confirm({
      title: 'Approve Milestone Completion?',
      icon: <ExclamationCircleOutlined />,
      content: 'This will mark the milestone as completed and release the payment to the freelancer. Continue?',
      onOk: async () => {
        setProcessing(true);
        try {
          console.log(`Completing milestone ${milestoneIndex} for escrow ${escrowId}`);
          
          await completeMilestone({
            signer: { 
              account,
              signAndSubmitTransaction 
            },
            escrowId,
            milestoneIndex,
          });
          
          message.success('Milestone completed and payment released!');
          
          // Refresh all data after a short delay to allow chain to update
          setTimeout(() => {
            refreshData();
          }, 2000);
        } catch (error) {
          console.error('Error completing milestone:', error);
          message.error('Failed to complete milestone: ' + error.message);
        } finally {
          setProcessing(false);
        }
      },
    });
  };

  // Handle cancellation of an escrow
  const handleCancelEscrow = async () => {
    if (!account || !escrow) return;

    confirm({
      title: 'Cancel this escrow?',
      icon: <ExclamationCircleOutlined />,
      content: 'This will cancel the escrow and return the funds to the client. Continue?',
      onOk: async () => {
        setProcessing(true);
        try {
          await cancelEscrow({
            signer: { 
              account,
              signAndSubmitTransaction 
            },
            escrowId,
            reason: 'Cancelled by client',
          });
          
          message.success('Escrow cancelled successfully!');
          
          // Refresh all data after a short delay
          setTimeout(() => {
            refreshData();
          }, 2000);
        } catch (error) {
          console.error('Error cancelling escrow:', error);
          message.error('Failed to cancel escrow: ' + error.message);
        } finally {
          setProcessing(false);
        }
      },
    });
  };

  // Handle creating a dispute
  const handleCreateDispute = async () => {
    if (!account || !escrow) return;

    confirm({
      title: 'Create a dispute?',
      icon: <ExclamationCircleOutlined />,
      content: 'This will mark the escrow as disputed. Continue?',
      onOk: async () => {
        setProcessing(true);
        try {
          await createDispute({
            signer: { 
              account,
              signAndSubmitTransaction 
            },
            escrowId,
            reason: 'Dispute initiated by user',
          });
          
          message.success('Dispute created successfully!');
          
          // Refresh after a short delay
          setTimeout(() => {
            refreshData();
          }, 2000);
        } catch (error) {
          console.error('Error creating dispute:', error);
          message.error('Failed to create dispute');
        } finally {
          setProcessing(false);
        }
      },
    });
  };

  // Calculate progress percentage of completed milestones
  const calculateProgress = () => {
    if (!milestones || milestones.length === 0) return 0;
    
    const completedCount = milestones.filter(m => m.status === 1 || m.status === 2).length;
    return Math.floor((completedCount / milestones.length) * 100);
  };

  // Determine if user is client or freelancer
  const isClient = escrow && account && escrow.client === account.address;
  const isFreelancer = escrow && account && escrow.freelancer === account.address;
  const canCancel = isClient && escrow && (escrow.status === 0 || escrow.freelancer === '0x0');
  const canCreateDispute = (isClient || isFreelancer) && escrow && escrow.status === 1;
  const canAccept = account && escrow && escrow.status === 0 && !isClient && !isFreelancer;

  // Render milestone status
  const renderMilestoneStatus = (status) => {
    const statusText = getMilestoneStatusText(status);
    switch (status) {
      case 0: // Pending
        return <Tag color="default">{statusText}</Tag>;
      case 1: // Completed
        return <Tag color="success">{statusText}</Tag>;
      case 2: // Paid
        return <Tag color="blue">{statusText}</Tag>;
      case 3: // Disputed
        return <Tag color="warning">{statusText}</Tag>;
      default:
        return <Tag>{statusText}</Tag>;
    }
  };

  // Render action buttons based on user role and escrow status
  const renderActionButtons = () => {
    if (canCancel) {
      return (
        <Button 
          danger 
          icon={<RollbackOutlined />} 
          onClick={handleCancelEscrow}
          loading={processing}
          size="large"
        >
          Cancel Escrow
        </Button>
      );
    } else if (canCreateDispute) {
      return (
        <Button 
          warning 
          icon={<ExclamationCircleOutlined />}
          onClick={handleCreateDispute}
          loading={processing}
          size="large"
        >
          Report Issue
        </Button>
      );
    }
    return null;
  };

  // If no wallet is connected
  if (!account) {
    return (
      <div className="escrow-details">
        <Button 
          type="link" 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate('/')}
          style={{ padding: 0, marginBottom: '20px' }}
        >
          Back to Dashboard
        </Button>
        
        <Alert
          message="Wallet Not Connected"
          description="Please connect your Aptos wallet to view and interact with this escrow."
          type="info"
          showIcon
          style={{ marginBottom: '20px' }}
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="escrow-details">
        <Button 
          type="link" 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate('/')}
          style={{ padding: 0, marginBottom: '20px' }}
        >
          Back to Dashboard
        </Button>
        
        <Alert
          message="Error Loading Escrow"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: '20px' }}
        />
        
        <Button onClick={refreshData}>Try Again</Button>
      </div>
    );
  }

  if (!escrow) {
    return (
      <Empty 
        description="Escrow not found or you don't have permission to view it" 
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      >
        <Button type="primary" onClick={() => navigate('/')}>
          Back to Dashboard
        </Button>
      </Empty>
    );
  }

  return (
    <div className="escrow-details">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <Button 
          type="link" 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate('/')}
          style={{ padding: 0 }}
        >
          Back to Dashboard
        </Button>
        <Button 
          icon={<ReloadOutlined />} 
          onClick={refreshData}
          loading={loading}
        >
          Refresh
        </Button>
      </div>
      
      {isFreelancer && escrow.status === 1 && (
        <Alert
          message="You are working on this project"
          description="As the freelancer, you'll receive payments when the client approves each milestone. Check back regularly for updates."
          type="info"
          showIcon
          style={{ marginBottom: '20px' }}
        />
      )}
      
      {canAccept && (
        <Alert
          message="Accept Project"
          description={
            <div>
              <p>You can accept this project as the freelancer.</p>
              <Button 
                type="primary" 
                icon={<CheckCircleOutlined />} 
                onClick={handleAcceptEscrow}
                loading={processing}
                size="large"
                style={{ marginTop: '10px' }}
              >
                Accept Project
              </Button>
            </div>
          }
          type="info"
          showIcon
          style={{ marginBottom: '20px' }}
        />
      )}
      
      {isClient && escrow.status === 1 && (
        <Alert
          message="Your Project is In Progress"
          description="You can approve milestones as they are completed to release payment to the freelancer."
          type="info"
          showIcon
          style={{ marginBottom: '20px' }}
        />
      )}
      
      <Card className="main-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <Title level={3}>{escrow.title}</Title>
          <Tag color="blue" style={{ fontSize: '16px', padding: '4px 12px' }}>
            {getEscrowStatusText(escrow.status)}
          </Tag>
        </div>
        
        <Descriptions bordered column={{ xs: 1, sm: 2, md: 3 }}>
          <Descriptions.Item label="Client">
            <Tag icon={<UserOutlined />}>{escrow.client}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Freelancer">
            {escrow.freelancer === '0x0' ? 
              <Tag>Not assigned yet</Tag> :
              <Tag icon={<UserOutlined />}>{escrow.freelancer}</Tag>
            }
          </Descriptions.Item>
          <Descriptions.Item label="Total Amount">
            <Tag icon={<DollarOutlined />} color="green">
              {formatAptAmount(escrow.totalAmount)}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Created On">
            {new Date(escrow.createdAt * 1000).toLocaleString()}
          </Descriptions.Item>
          {escrow.completedAt > 0 && (
            <Descriptions.Item label="Completed On">
              {new Date(escrow.completedAt * 1000).toLocaleString()}
            </Descriptions.Item>
          )}
        </Descriptions>
        
        <div style={{ margin: '24px 0' }}>
          <Title level={4}>Project Description</Title>
          <Paragraph>{escrow.description}</Paragraph>
        </div>
        
        <Divider />
        
        <div style={{ margin: '24px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <Title level={4}>Milestones & Progress</Title>
            <Progress 
              type="circle" 
              percent={calculateProgress()} 
              width={80} 
              format={percent => `${percent}%`}
            />
          </div>
          
          {milestones.length > 0 ? (
            <Collapse defaultActiveKey={['0']}>
              {milestones.map((milestone, idx) => (
                <Panel 
                  header={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                      <span>Milestone #{idx + 1}: {milestone.description.substring(0, 30)}...</span>
                      <div>
                        {renderMilestoneStatus(milestone.status)}
                        <Tag color="green" style={{ marginLeft: '8px' }}>
                          {formatAptAmount(milestone.amount)}
                        </Tag>
                      </div>
                    </div>
                  }
                  key={idx}
                >
                  <Descriptions bordered column={1}>
                    <Descriptions.Item label="Description">
                      {milestone.description}
                    </Descriptions.Item>
                    <Descriptions.Item label="Payment Amount">
                      {formatAptAmount(milestone.amount)}
                    </Descriptions.Item>
                    {milestone.deadline > 0 && (
                      <Descriptions.Item label="Expected Completion">
                        {new Date(milestone.deadline * 1000).toLocaleDateString()}
                      </Descriptions.Item>
                    )}
                    <Descriptions.Item label="Status">
                      {renderMilestoneStatus(milestone.status)}
                    </Descriptions.Item>
                  </Descriptions>
                  
                  {/* Show approval button only if user is client and milestone is pending */}
                  {isClient && escrow.status === 1 && milestone.status === 0 && (
                    <Button 
                      type="primary" 
                      icon={<CheckCircleOutlined />} 
                      style={{ marginTop: '16px' }}
                      onClick={() => handleCompleteMilestone(milestone.index)}
                      loading={processing}
                    >
                      Approve Completion & Release Payment
                    </Button>
                  )}
                  
                  {/* Show information for freelancer */}
                  {isFreelancer && milestone.status === 0 && (
                    <Alert
                      message="Awaiting client approval"
                      description="When you complete this milestone, notify the client to approve it for payment."
                      type="warning"
                      showIcon
                      style={{ marginTop: '16px' }}
                    />
                  )}
                  
                  {/* Show information for completed milestones */}
                  {milestone.status === 2 && isFreelancer && (
                    <Alert
                      message="Payment received"
                      description="This milestone has been completed and you have received the payment."
                      type="success"
                      showIcon
                      style={{ marginTop: '16px' }}
                    />
                  )}
                </Panel>
              ))}
            </Collapse>
          ) : (
            <Empty description="No milestones found" />
          )}
        </div>
        
        <Divider />
        
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
          {renderActionButtons()}
        </div>
      </Card>
    </div>
  );
}

export default EscrowDetails; 