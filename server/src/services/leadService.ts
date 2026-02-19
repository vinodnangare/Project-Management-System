import mongoose from "mongoose";
import LeadModel from "../models/Lead.js";
import UserModel from "../models/User.js";

import { Lead, LeadStage, PaginationMeta } from '../types/index.js';
import { CreateLeadRequest, UpdateLeadRequest } from '../validators/lead.js';



interface QueryOptions {
  page?: number;
  limit?: number;
  stage?: string;
  source?: string;
  owner?: string;
}

export const getAllLeads = async (options: any) => {

  const page = Number(options.page || 1);
  const limit = Number(options.limit || 10);
  const skip = (page - 1) * limit;

  const filter: any = { is_deleted: false };

  if (options.stage) filter.stage = options.stage;
  if (options.source) filter.source = options.source;
  if (options.owner) filter.owner_id = options.owner;

  const [leads, total] = await Promise.all([
    LeadModel.find(filter)
      .populate("owner_id", "full_name email")
      .populate("created_by", "full_name email")
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),

    LeadModel.countDocuments(filter)
  ]);

  return {
    leads,
    meta: { total, page, limit, pages: Math.ceil(total / limit) }
  };
};


export const getLeadById = async (leadId: string) => {

  return await LeadModel.findOne({ _id: leadId, is_deleted: false })
    .populate("owner_id", "full_name email")
    .populate("created_by", "full_name email")
    .lean();
};


export const createLead = async (data: any, createdBy: string) => {

  const lead = await LeadModel.create({
    ...data,
    created_by: createdBy
  });

  return lead.toObject();
};


export const updateLead = async (leadId: string, updates: any) => {

  const lead = await LeadModel.findByIdAndUpdate(
    leadId,
    updates,
    { new: true }
  );

  if (!lead) throw new Error("Lead not found");

  return lead.toObject();
};


export const updateLeadStage = async (leadId: string, stage: string) => {
  return await updateLead(leadId, { stage });
};


export const deleteLead = async (leadId: string) => {
  await LeadModel.updateOne({ _id: leadId }, { is_deleted: true });
};


export const getLeadStats = async () => {

  const stats = await LeadModel.aggregate([
    { $match: { is_deleted: false } },
    {
      $facet: {
        byStage: [{ $group: { _id: "$stage", count: { $sum: 1 } } }],
        bySource: [{ $group: { _id: "$source", count: { $sum: 1 } } }],
        byPriority: [{ $group: { _id: "$priority", count: { $sum: 1 } } }],
        total: [{ $count: "total" }]
      }
    }
  ]);

  return stats[0];
};


export const getAssignableOwners = async () => {

  const users = await UserModel.find({ is_active: true })
    .select("_id full_name email")
    .sort({ full_name: 1 })
    .lean();

  return users.map(u => ({
    id: u._id.toString(),
    full_name: u.full_name,
    email: u.email
  }));
};
