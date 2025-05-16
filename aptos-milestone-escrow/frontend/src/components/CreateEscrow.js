import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { 
  Form, 
  Input, 
  Button, 
  Typography, 
  Card, 
  InputNumber, 
  DatePicker, 
  Divider, 
  message, 
  Space,
  Alert
} from 'antd';
import { 
  PlusOutlined, 
  DeleteOutlined, 
  ArrowLeftOutlined, 
  CheckCircleOutlined 
} from '@ant-design/icons';

import { createEscrow } from '../utils/contractUtils';

const { Title, Text } = Typography;
const { TextArea } = Input;

function CreateEscrow() {
  const navigate = useNavigate();
  const { account, signAndSubmitTransaction } = useWallet();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [successTxHash, setSuccessTxHash] = useState(null);
  const [error, setError] = useState(null);

  // Convert date object to Unix timestamp (seconds)
  const dateToTimestamp = (date) => {
    return date ? Math.floor(date.valueOf() / 1000) : 0;
  };

  const onFinish = async (values) => {
    if (!account) {
      message.error('Please connect your wallet first');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      // Parse form values
      const { title, description, milestones } = values;
      
      // Validate that at least one milestone exists
      if (!milestones || milestones.length === 0) {
        throw new Error("At least one milestone is required");
      }
      
      // Validate that all milestones have descriptions and amounts
      milestones.forEach((milestone, index) => {
        if (!milestone.description || milestone.description.trim() === '') {
          throw new Error(`Milestone #${index + 1} is missing a description`);
        }
        if (!milestone.amount || milestone.amount <= 0) {
          throw new Error(`Milestone #${index + 1} must have a payment amount greater than 0`);
        }
      });
      
      // Prepare milestone arrays for contract
      // Ensure strings are properly formatted, not objects
      const milestoneDescriptions = milestones.map(m => String(m.description || ""));
      const milestoneAmounts = milestones.map(m => Math.floor((m.amount || 0) * 100000000)); // Convert APT to Octas (8 decimals)
      const milestoneDeadlines = milestones.map(m => dateToTimestamp(m.deadline) || 0);
      
      const totalAmount = milestoneAmounts.reduce((sum, amount) => sum + amount, 0);
      
      console.log("Creating escrow with:", {
        title,
        description,
        milestoneDescriptions,
        milestoneAmounts,
        milestoneDeadlines,
        totalAmount: totalAmount / 100000000 + " APT"
      });
      
      // Call contract method
      const txHash = await createEscrow({
        signer: {
          account,
          signAndSubmitTransaction
        },
        title: String(title || ""),
        description: String(description || ""),
        milestoneDescriptions,
        milestoneAmounts,
        milestoneDeadlines,
      });
      
      setSuccessTxHash(txHash);
      message.success('Escrow created successfully!');
      
      // Wait 3 seconds before navigating to allow the user to see the success message
      // and the blockchain to process the transaction
      setTimeout(() => {
        navigate('/');
      }, 3000);
    } catch (error) {
      console.error('Error creating escrow:', error);
      setError(error.message || 'Failed to create escrow. Please try again.');
      message.error('Failed to create escrow: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  // If no wallet is connected
  if (!account) {
    return (
      <div className="create-escrow">
        <Button 
          type="link" 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate('/')}
          style={{ marginBottom: '20px', padding: 0 }}
        >
          Back to Dashboard
        </Button>
        
        <Title level={2}>Create New Escrow</Title>
        
        <Alert
          message="Wallet Not Connected"
          description="Please connect your Aptos wallet to create an escrow."
          type="warning"
          showIcon
          style={{ marginBottom: '20px' }}
        />
      </div>
    );
  }

  return (
    <div className="create-escrow">
      <Button 
        type="link" 
        icon={<ArrowLeftOutlined />} 
        onClick={() => navigate('/')}
        style={{ marginBottom: '20px', padding: 0 }}
      >
        Back to Dashboard
      </Button>
      
      <Title level={2}>Create New Escrow</Title>
      <Text type="secondary" style={{ marginBottom: '24px', display: 'block' }}>
        Define your project and set up milestone payments for your freelancer
      </Text>
      
      {successTxHash && (
        <Alert
          message="Escrow Created Successfully!"
          description={
            <div>
              <p>Your escrow has been created and funds have been locked in the contract.</p>
              <p>Transaction Hash: {successTxHash}</p>
              <p>Redirecting to dashboard...</p>
            </div>
          }
          type="success"
          showIcon
          style={{ marginBottom: '20px' }}
        />
      )}
      
      {error && (
        <Alert
          message="Error Creating Escrow"
          description={error}
          type="error"
          showIcon
          closable
          style={{ marginBottom: '20px' }}
        />
      )}
      
      <Card className="main-content">
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          className="form-container"
          initialValues={{
            milestones: [{ description: '', amount: 0, deadline: null }],
          }}
        >
          <Title level={4}>Project Details</Title>
          <Form.Item
            name="title"
            label="Project Title"
            rules={[{ required: true, message: 'Please enter a project title' }]}
          >
            <Input placeholder="e.g., Website Development, Logo Design" />
          </Form.Item>
          
          <Form.Item
            name="description"
            label="Project Description"
            rules={[{ required: true, message: 'Please enter a project description' }]}
          >
            <TextArea 
              placeholder="Describe the project, requirements, and expectations" 
              rows={4} 
            />
          </Form.Item>
          
          <Divider />
          
          <Title level={4}>Milestones</Title>
          <Text type="secondary" style={{ marginBottom: '16px', display: 'block' }}>
            Break down your project into specific milestones with deliverables and payments
          </Text>
          
          <Form.List name="milestones">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <div key={key} className="milestone-form-list">
                    <Space 
                      style={{ display: 'flex', marginBottom: 8, justifyContent: 'space-between' }} 
                      align="baseline"
                    >
                      <Title level={5}>Milestone #{name + 1}</Title>
                      {fields.length > 1 ? (
                        <Button 
                          type="text" 
                          danger 
                          icon={<DeleteOutlined />} 
                          onClick={() => remove(name)} 
                        />
                      ) : null}
                    </Space>
                    
                    <Form.Item
                      {...restField}
                      name={[name, 'description']}
                      label="Deliverable"
                      rules={[{ required: true, message: 'Please enter milestone deliverable' }]}
                    >
                      <TextArea placeholder="What will be delivered in this milestone" rows={2} />
                    </Form.Item>
                    
                    <Form.Item
                      {...restField}
                      name={[name, 'amount']}
                      label="Payment Amount (APT)"
                      rules={[{ required: true, message: 'Please enter amount' }]}
                    >
                      <InputNumber 
                        min={0.00000001} 
                        step={0.1} 
                        precision={8} 
                        style={{ width: '100%' }}
                        placeholder="0.00000000" 
                      />
                    </Form.Item>
                    
                    <Form.Item
                      {...restField}
                      name={[name, 'deadline']}
                      label="Expected Completion Date (Optional)"
                    >
                      <DatePicker style={{ width: '100%' }} />
                    </Form.Item>
                  </div>
                ))}
                
                <Form.Item>
                  <Button 
                    type="dashed" 
                    onClick={() => add()} 
                    icon={<PlusOutlined />} 
                    className="add-milestone-button"
                  >
                    Add Another Milestone
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>
          
          <Divider />
          
          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              size="large" 
              block
              loading={submitting}
              icon={<CheckCircleOutlined />}
              disabled={successTxHash !== null}
            >
              Create Escrow
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}

export default CreateEscrow; 