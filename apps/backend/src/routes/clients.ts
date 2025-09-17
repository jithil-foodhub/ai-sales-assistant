import { Request, Response } from 'express';
import { Client, IClient } from '../models/Client';
import { CallRecord, ICallRecord } from '../models/CallRecord';
import { mongoDBService } from '../services/mongodb';

// Get all clients with pagination and filtering
export async function getClients(req: Request, res: Response) {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      status = 'all',
      mood = 'all',
      sortBy = 'lastCallDate',
      sortOrder = 'desc'
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build filter query
    const filter: any = {};

    if (search) {
      filter.$or = [
        { phoneNumber: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
        { lastInteraction: { $regex: search, $options: 'i' } }
      ];
    }

    if (status !== 'all') {
      filter.status = status;
    }

    // Get clients
    const clients = await Client.find(filter)
      .sort({ [sortBy as string]: sortOrder === 'desc' ? -1 : 1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Get total count for pagination
    const total = await Client.countDocuments(filter);

    // Get mood information for each client from their latest call
    const clientsWithMood = await Promise.all(
      clients.map(async (client) => {
        const latestCall = await CallRecord.findOne({ clientId: client._id })
          .sort({ timestamp: -1 })
          .select('mood sentiment')
          .lean();

        return {
          ...client,
          mood: latestCall?.mood || 'unknown',
          sentiment: latestCall?.sentiment || 0
        };
      })
    );

    // Filter by mood if specified
    let filteredClients = clientsWithMood;
    if (mood !== 'all') {
      filteredClients = clientsWithMood.filter(client => client.mood === mood);
    }

    res.json({
      success: true,
      data: filteredClients,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalItems: total,
        itemsPerPage: limitNum
      }
    });

  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch clients'
    });
  }
}

// Get single client by ID
export async function getClient(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const client = await Client.findById(id);
    if (!client) {
      return res.status(404).json({
        success: false,
        error: 'Client not found'
      });
    }

    // Get call history for this client
    const callHistory = await CallRecord.find({ clientId: id })
      .sort({ timestamp: -1 })
      .limit(10)
      .lean();

    res.json({
      success: true,
      data: {
        ...client.toObject(),
        callHistory
      }
    });

  } catch (error) {
    console.error('Error fetching client:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch client'
    });
  }
}

// Create new client
export async function createClient(req: Request, res: Response) {
  try {
    const { phoneNumber, name, email, company, notes } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        error: 'Phone number is required'
      });
    }

    // Check if client already exists
    const existingClient = await Client.findOne({ phoneNumber });
    if (existingClient) {
      return res.status(409).json({
        success: false,
        error: 'Client with this phone number already exists'
      });
    }

    const client = new Client({
      phoneNumber,
      name,
      email,
      company,
      notes,
      status: 'prospect'
    });

    await client.save();

    res.status(201).json({
      success: true,
      data: client
    });

  } catch (error) {
    console.error('Error creating client:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create client'
    });
  }
}

// Update client
export async function updateClient(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const updates = req.body;

    const client = await Client.findByIdAndUpdate(
      id,
      { ...updates, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!client) {
      return res.status(404).json({
        success: false,
        error: 'Client not found'
      });
    }

    res.json({
      success: true,
      data: client
    });

  } catch (error) {
    console.error('Error updating client:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update client'
    });
  }
}

// Delete client
export async function deleteClient(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const client = await Client.findByIdAndDelete(id);
    if (!client) {
      return res.status(404).json({
        success: false,
        error: 'Client not found'
      });
    }

    // Also delete associated call records
    await CallRecord.deleteMany({ clientId: id });

    res.json({
      success: true,
      message: 'Client and associated call records deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting client:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete client'
    });
  }
}

// Get client statistics
export async function getClientStats(req: Request, res: Response) {
  try {
    const totalClients = await Client.countDocuments();
    const activeClients = await Client.countDocuments({ status: 'active' });
    const prospects = await Client.countDocuments({ status: 'prospect' });
    const converted = await Client.countDocuments({ status: 'converted' });

    // Get mood distribution from latest calls
    const moodStats = await CallRecord.aggregate([
      {
        $sort: { timestamp: -1 }
      },
      {
        $group: {
          _id: '$clientId',
          latestMood: { $first: '$mood' }
        }
      },
      {
        $group: {
          _id: '$latestMood',
          count: { $sum: 1 }
        }
      }
    ]);

    const moodDistribution = moodStats.reduce((acc, stat) => {
      acc[stat._id] = stat.count;
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        totalClients,
        activeClients,
        prospects,
        converted,
        moodDistribution
      }
    });

  } catch (error) {
    console.error('Error fetching client stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch client statistics'
    });
  }
}

// Get client call history
export async function getClientCalls(req: Request, res: Response) {
  try {
    const { agentId } = req.params;
    
    const calls = await CallRecord.find({ clientId: agentId })
      .sort({ timestamp: -1 })
      .limit(50)
      .lean();

    res.json({
      success: true,
      data: calls
    });
  } catch (error) {
    console.error('Error fetching client calls:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch client calls'
    });
  }
}

// Clear all data for a specific client
export async function clearClientData(req: Request, res: Response) {
  try {
    const { clientId } = req.params;
    
    console.log(`🗑️ Clearing all data for client ${clientId}`);
    
    // Delete all call records for this client
    const callRecordsResult = await CallRecord.deleteMany({ clientId });
    console.log(`📞 Deleted ${callRecordsResult.deletedCount} call records`);
    
    // Delete the client itself
    const clientResult = await Client.findByIdAndDelete(clientId);
    if (!clientResult) {
      return res.status(404).json({
        success: false,
        error: 'Client not found'
      });
    }
    
    console.log(`👤 Deleted client: ${clientResult.phoneNumber}`);
    
    res.json({
      success: true,
      data: {
        message: 'Client data cleared successfully',
        deletedCallRecords: callRecordsResult.deletedCount,
        clientPhoneNumber: clientResult.phoneNumber
      }
    });
    
  } catch (error) {
    console.error('Error clearing client data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear client data'
    });
  }
}
