import mongoose from 'mongoose';
import { Lead, User, ILead } from '../models/index.js';
import { Lead as LeadType, LeadStage, PaginationMeta } from '../types/index.js';
import { CreateLeadRequest, UpdateLeadRequest } from '../validators/lead.js';

interface QueryOptions {
  page?: number;
  limit?: number;
  stage?: string;
  source?: string;
  owner?: string;
}

const formatLeadResponse = async (lead: ILead): Promise<LeadType> => {
  const owner = lead.owner_id ? await User.findById(lead.owner_id) : null;
  const creator = await User.findById(lead.created_by);

  return {
    id: lead._id.toString(),
    company_name: lead.company_name,
    contact_name: lead.contact_name,
    email: lead.email,
    phone: lead.phone || null,
    stage: lead.stage as LeadStage,
    priority: lead.priority as any,
    source: lead.source as any,
    owner_id: lead.owner_id?.toString() || null,
    owner_name: owner?.full_name || null,
    owner_email: owner?.email || null,
    created_by: lead.created_by.toString(),
    created_by_name: creator?.full_name || null,
    created_by_email: creator?.email || null,
    is_deleted: lead.is_deleted,
    created_at: lead.created_at.toISOString(),
    updated_at: lead.updated_at.toISOString()
  };
};

export const getAllLeads = async (
  options: QueryOptions,
  userId: string,
  userRole: string
): Promise<{ leads: LeadType[]; meta: PaginationMeta }> => {
  try {
    const { page = 1, limit = 10, stage, source, owner } = options;
    const skip = (page - 1) * limit;

    const conditions: any = { is_deleted: false };

    if (stage) conditions.stage = stage;
    if (source) conditions.source = source;
    if (owner) conditions.owner_id = new mongoose.Types.ObjectId(owner);

    const total = await Lead.countDocuments(conditions);

    const leads = await Lead.find(conditions)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit);

    const formattedLeads = await Promise.all(leads.map(formatLeadResponse));

    return {
      leads: formattedLeads,
      meta: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    console.error('getAllLeads error:', error);
    throw error;
  }
};

export const getLeadById = async (leadId: string): Promise<LeadType | null> => {
  try {
    const lead = await Lead.findOne({
      _id: new mongoose.Types.ObjectId(leadId),
      is_deleted: false
    });

    if (!lead) return null;

    return formatLeadResponse(lead);
  } catch (error) {
    return null;
  }
};

export const createLead = async (
  leadData: CreateLeadRequest,
  createdBy: string
): Promise<LeadType> => {
  // Check if company name already exists
  const existingLead = await Lead.findOne({
    company_name: { $regex: new RegExp(`^${leadData.company_name.trim()}$`, 'i') },
    is_deleted: false
  });

  if (existingLead) {
    throw new Error(`A lead with company name "${leadData.company_name}" already exists`);
  }

  const lead = await Lead.create({
    company_name: leadData.company_name,
    contact_name: leadData.contact_name,
    email: leadData.email,
    phone: leadData.phone || null,
    stage: leadData.stage,
    priority: leadData.priority,
    source: leadData.source,
    owner_id: leadData.owner_id ? new mongoose.Types.ObjectId(leadData.owner_id) : null,
    created_by: new mongoose.Types.ObjectId(createdBy),
    notes: leadData.notes || null,
    is_deleted: false
  });

  return formatLeadResponse(lead);
};

export const updateLead = async (
  leadId: string,
  updates: UpdateLeadRequest
): Promise<LeadType> => {
  const updateFields: Record<string, any> = {};

  // If company name is being updated, check for duplicates
  if (updates.company_name !== undefined) {
    const existingLead = await Lead.findOne({
      company_name: { $regex: new RegExp(`^${updates.company_name.trim()}$`, 'i') },
      is_deleted: false,
      _id: { $ne: new mongoose.Types.ObjectId(leadId) }
    });

    if (existingLead) {
      throw new Error(`A lead with company name "${updates.company_name}" already exists`);
    }
    updateFields.company_name = updates.company_name;
  }

  if (updates.contact_name !== undefined) updateFields.contact_name = updates.contact_name;
  if (updates.email !== undefined) updateFields.email = updates.email;
  if (updates.phone !== undefined) updateFields.phone = updates.phone;
  if (updates.stage !== undefined) updateFields.stage = updates.stage;
  if (updates.priority !== undefined) updateFields.priority = updates.priority;
  if (updates.source !== undefined) updateFields.source = updates.source;
  if (updates.owner_id !== undefined) {
    updateFields.owner_id = updates.owner_id ? new mongoose.Types.ObjectId(updates.owner_id) : null;
  }
  if (updates.notes !== undefined) updateFields.notes = updates.notes;

  if (Object.keys(updateFields).length === 0) {
    const lead = await getLeadById(leadId);
    if (!lead) {
      throw new Error('Lead not found');
    }
    return lead;
  }

  const updatedLead = await Lead.findByIdAndUpdate(
    leadId,
    { $set: updateFields },
    { new: true }
  );

  if (!updatedLead) {
    throw new Error('Lead not found after update');
  }

  return formatLeadResponse(updatedLead);
};

export const updateLeadStage = async (
  leadId: string,
  stage: LeadStage
): Promise<LeadType> => {
  const updatedLead = await Lead.findByIdAndUpdate(
    leadId,
    { $set: { stage } },
    { new: true }
  );

  if (!updatedLead) {
    throw new Error('Lead not found after stage update');
  }

  return formatLeadResponse(updatedLead);
};

export const deleteLead = async (leadId: string): Promise<void> => {
  await Lead.findByIdAndUpdate(leadId, { $set: { is_deleted: true } });
};

export const getLeadStats = async (
  userId: string,
  userRole: string
): Promise<any> => {
  const conditions: any = { is_deleted: false };

  if (userRole !== 'admin') {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    conditions.$or = [
      { owner_id: userObjectId },
      { created_by: userObjectId }
    ];
  }

  // Get stage counts
  const stageStats = await Lead.aggregate([
    { $match: conditions },
    { $group: { _id: '$stage', count: { $sum: 1 } } }
  ]);

  // Get source counts
  const sourceStats = await Lead.aggregate([
    { $match: conditions },
    { $group: { _id: '$source', count: { $sum: 1 } } }
  ]);

  // Get priority counts
  const priorityStats = await Lead.aggregate([
    { $match: conditions },
    { $group: { _id: '$priority', count: { $sum: 1 } } }
  ]);

  // Get total count
  const totalLeads = await Lead.countDocuments(conditions);

  // Get leads created this week
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const newLeadsThisWeek = await Lead.countDocuments({
    ...conditions,
    created_at: { $gte: weekAgo }
  });

  // Get leads created this month
  const monthAgo = new Date();
  monthAgo.setDate(monthAgo.getDate() - 30);
  const newLeadsThisMonth = await Lead.countDocuments({
    ...conditions,
    created_at: { $gte: monthAgo }
  });

  // Get average time to convert (only for won leads)
  const wonConditions = { ...conditions, stage: 'won' };
  const avgTimeResult = await Lead.aggregate([
    { $match: wonConditions },
    {
      $project: {
        daysToConvert: {
          $divide: [
            { $subtract: ['$updated_at', '$created_at'] },
            1000 * 60 * 60 * 24 // Convert ms to days
          ]
        }
      }
    },
    {
      $group: {
        _id: null,
        avgDays: { $avg: '$daysToConvert' }
      }
    }
  ]);

  const stageMap: Record<string, number> = {
    new: 0,
    in_discussion: 0,
    quoted: 0,
    won: 0,
    lost: 0
  };
  stageStats.forEach((s: any) => {
    stageMap[s._id] = s.count;
  });

  const sourceMap: Record<string, number> = {
    web: 0,
    referral: 0,
    campaign: 0,
    manual: 0
  };
  sourceStats.forEach((s: any) => {
    sourceMap[s._id] = s.count;
  });

  const priorityMap: Record<string, number> = {
    high: 0,
    medium: 0,
    low: 0
  };
  priorityStats.forEach((p: any) => {
    priorityMap[p._id] = p.count;
  });

  const wonLeads = stageMap.won || 0;
  const lostLeads = stageMap.lost || 0;
  const activeLeads = totalLeads - wonLeads - lostLeads;
  const conversionRate = totalLeads > 0 
    ? ((wonLeads / totalLeads) * 100).toFixed(2)
    : '0.00';
  const averageTimeToConvert = avgTimeResult[0]?.avgDays || 0;

  return {
    totalLeads,
    activeLeads,
    wonLeads,
    lostLeads,
    newLeadsThisWeek,
    newLeadsThisMonth,
    conversionRate: parseFloat(conversionRate),
    averageTimeToConvert: Math.round(averageTimeToConvert),
    lastWeekConversionTrend: 0,
    lastMonthConversionTrend: 0,
    byStage: stageMap,
    bySource: sourceMap,
    byPriority: priorityMap
  };
};

export const getAssignableOwners = async (): Promise<Array<{ id: string; full_name: string; email: string }>> => {
  const users = await User.find({ is_active: true })
    .select('full_name email')
    .sort({ full_name: 1 });

  return users.map(u => ({
    id: u._id.toString(),
    full_name: u.full_name,
    email: u.email
  }));
};