import { AptosClient } from 'aptos';

// Replace with your contract address once deployed
const MODULE_ADDRESS = '0x0726ea2567b15ba4d1e62a379a677ba2cacab96401dd8b187486fe3a97057b70';
const MODULE_NAME = 'milestone_escrow';

// Aptos network information (testnet for this demo)
const NODE_URL = 'https://fullnode.testnet.aptoslabs.com';
const client = new AptosClient(NODE_URL);

export const getModuleAddress = () => {
  return MODULE_ADDRESS;
};

// Create a new escrow with milestones
export const createEscrow = async ({
  signer,
  title,
  description,
  milestoneDescriptions,
  milestoneAmounts,
  milestoneDeadlines,
}) => {
  try {
    // Ensure all strings are properly encoded
    const payload = {
      type: 'entry_function_payload',
      function: `${MODULE_ADDRESS}::${MODULE_NAME}::create_escrow`,
      type_arguments: [],
      arguments: [
        title,
        description,
        milestoneDescriptions,
        milestoneAmounts,
        milestoneDeadlines,
      ],
    };

    console.log("Submitting transaction with payload:", payload);
    const response = await signer.signAndSubmitTransaction(payload);
    console.log("Transaction submitted:", response);
    await client.waitForTransaction(response.hash);
    console.log("Transaction confirmed");
    return response.hash;
  } catch (error) {
    console.error('Error creating escrow:', error);
    throw error;
  }
};

// Accept an escrow as a freelancer
export const acceptEscrow = async ({ signer, escrowId }) => {
  try {
    console.log(`Accepting escrow with ID ${escrowId}`);
    
    const payload = {
      type: 'entry_function_payload',
      function: `${MODULE_ADDRESS}::${MODULE_NAME}::accept_escrow`,
      type_arguments: [],
      arguments: [escrowId],
    };

    console.log("Acceptance payload:", payload);
    const response = await signer.signAndSubmitTransaction(payload);
    console.log("Acceptance transaction submitted:", response);
    await client.waitForTransaction(response.hash);
    console.log("Acceptance transaction confirmed");
    return response.hash;
  } catch (error) {
    console.error('Error accepting escrow:', error);
    throw error;
  }
};

// Complete a milestone (client approves work)
export const completeMilestone = async ({ signer, escrowId, milestoneIndex }) => {
  try {
    console.log(`Completing milestone ${milestoneIndex} for escrow ${escrowId}`);
    const payload = {
      type: 'entry_function_payload',
      function: `${MODULE_ADDRESS}::${MODULE_NAME}::complete_milestone`,
      type_arguments: [],
      arguments: [escrowId, milestoneIndex],
    };

    const response = await signer.signAndSubmitTransaction(payload);
    console.log("Milestone completion transaction submitted:", response);
    await client.waitForTransaction(response.hash);
    console.log("Milestone completion transaction confirmed");
    return response.hash;
  } catch (error) {
    console.error('Error completing milestone:', error);
    throw error;
  }
};

// Cancel an escrow
export const cancelEscrow = async ({ signer, escrowId, reason }) => {
  try {
    const payload = {
      type: 'entry_function_payload',
      function: `${MODULE_ADDRESS}::${MODULE_NAME}::cancel_escrow`,
      type_arguments: [],
      arguments: [escrowId, reason],
    };

    const response = await signer.signAndSubmitTransaction(payload);
    await client.waitForTransaction(response.hash);
    return response.hash;
  } catch (error) {
    console.error('Error cancelling escrow:', error);
    throw error;
  }
};

// Create a dispute
export const createDispute = async ({ signer, escrowId, reason }) => {
  try {
    const payload = {
      type: 'entry_function_payload',
      function: `${MODULE_ADDRESS}::${MODULE_NAME}::create_dispute`,
      type_arguments: [],
      arguments: [escrowId, reason],
    };

    const response = await signer.signAndSubmitTransaction(payload);
    await client.waitForTransaction(response.hash);
    return response.hash;
  } catch (error) {
    console.error('Error creating dispute:', error);
    throw error;
  }
};

// Get client escrows
export const getClientEscrows = async (address) => {
  try {
    console.log("Getting client escrows for:", address);
    const response = await client.view({
      function: `${MODULE_ADDRESS}::${MODULE_NAME}::get_client_escrows`,
      type_arguments: [],
      arguments: [address],
    });
    
    console.log("Client escrows raw response:", response);
    
    // Handle different response formats
    let escrowIds = [];
    if (Array.isArray(response) && response.length > 0) {
      if (Array.isArray(response[0])) {
        escrowIds = response[0];
      } else {
        escrowIds = response;
      }
    }
    
    console.log("Processed client escrow IDs:", escrowIds);
    return escrowIds;
  } catch (error) {
    console.error('Error getting client escrows:', error, error.stack);
    return [];
  }
};

// Get freelancer escrows
export const getFreelancerEscrows = async (address) => {
  try {
    console.log("Getting freelancer escrows for:", address);
    const response = await client.view({
      function: `${MODULE_ADDRESS}::${MODULE_NAME}::get_freelancer_escrows`,
      type_arguments: [],
      arguments: [address],
    });
    
    console.log("Freelancer escrows raw response:", response);
    
    // Handle different response formats
    let escrowIds = [];
    if (Array.isArray(response) && response.length > 0) {
      if (Array.isArray(response[0])) {
        escrowIds = response[0];
      } else {
        escrowIds = response;
      }
    }
    
    console.log("Processed freelancer escrow IDs:", escrowIds);
    return escrowIds;
  } catch (error) {
    console.error('Error getting freelancer escrows:', error, error.stack);
    return [];
  }
};

// Get open escrows
export const getOpenEscrows = async () => {
  try {
    console.log("Getting open escrows");
    const response = await client.view({
      function: `${MODULE_ADDRESS}::${MODULE_NAME}::get_open_escrows`,
      type_arguments: [],
      arguments: [],
    });
    
    console.log("Open escrows raw response:", response);
    
    // Handle different response formats
    let escrowIds = [];
    if (Array.isArray(response) && response.length > 0) {
      if (Array.isArray(response[0])) {
        escrowIds = response[0];
      } else {
        escrowIds = response;
      }
    }
    
    console.log("Processed open escrow IDs:", escrowIds);
    return escrowIds;
  } catch (error) {
    console.error('Error getting open escrows:', error, error.stack);
    return [];
  }
};

// Get escrow details
export const getEscrowDetails = async (escrowId) => {
  try {
    console.log("Getting details for escrow:", escrowId);
    const details = await client.view({
      function: `${MODULE_ADDRESS}::${MODULE_NAME}::get_escrow_details`,
      type_arguments: [],
      arguments: [escrowId],
    });
    
    console.log("Escrow details raw response:", details);
    
    if (Array.isArray(details) && details.length >= 8) {
      const result = {
        client: details[0],
        freelancer: details[1],
        title: details[2],
        description: details[3],
        totalAmount: details[4],
        status: details[5],
        createdAt: details[6],
        completedAt: details[7],
      };
      console.log("Processed escrow details:", result);
      return result;
    }
    return null;
  } catch (error) {
    console.error('Error getting escrow details:', error, error.stack);
    return null;
  }
};

// Get milestone details
export const getMilestoneDetails = async (escrowId, milestoneIndex) => {
  try {
    console.log(`Getting details for milestone ${milestoneIndex} of escrow ${escrowId}`);
    const details = await client.view({
      function: `${MODULE_ADDRESS}::${MODULE_NAME}::get_milestone_details`,
      type_arguments: [],
      arguments: [escrowId, milestoneIndex],
    });
    
    console.log("Milestone details raw response:", details);
    
    if (Array.isArray(details) && details.length >= 4) {
      const result = {
        description: details[0],
        amount: details[1],
        deadline: details[2],
        status: details[3],
      };
      console.log("Processed milestone details:", result);
      return result;
    } else {
      console.error("Invalid milestone details format:", details);
      return null;
    }
  } catch (error) {
    console.error('Error getting milestone details:', error, error.stack);
    return null;
  }
};

// Get milestone count for an escrow
export const getMilestoneCount = async (escrowId) => {
  try {
    console.log("Getting milestone count for escrow:", escrowId);
    const response = await client.view({
      function: `${MODULE_ADDRESS}::${MODULE_NAME}::get_milestone_count`,
      type_arguments: [],
      arguments: [escrowId],
    });
    
    console.log("Milestone count raw response:", response);
    
    if (Array.isArray(response) && response.length > 0) {
      return Number(response[0]);
    } else if (typeof response === 'number') {
      return response;
    } else {
      return 0;
    }
  } catch (error) {
    console.error('Error getting milestone count:', error, error.stack);
    return 0;
  }
};

// Helper functions to convert status codes to text
export const getEscrowStatusText = (statusCode) => {
  const statuses = {
    0: 'Open',
    1: 'In Progress',
    2: 'Completed',
    3: 'Cancelled',
    4: 'Disputed',
  };
  return statuses[statusCode] || 'Unknown';
};

export const getMilestoneStatusText = (statusCode) => {
  const statuses = {
    0: 'Pending',
    1: 'Completed',
    2: 'Paid',
    3: 'Disputed',
  };
  return statuses[statusCode] || 'Unknown';
};

// Format APT amount for display (with 8 decimals)
export const formatAptAmount = (amount) => {
  const value = amount / 100000000;
  return `${value.toFixed(8)} APT`;
}; 