import { Request, Response } from 'express';
import { ZodError } from 'zod';
import * as leadService from '../services/leadService.js';
import { 
  createLeadSchema, 
  updateLeadSchema, 
  updateLeadStageSchema 
} from '../validators/lead.js';

export const getAllLeads = async (
  req: Request,
  res: Response
) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const stage = req.query.stage as string | undefined;
    const source = req.query.source as string | undefined;
    const owner = req.query.owner as string | undefined;

    if (page < 1 || limit < 1 || limit > 100) {
      res.status(400).json({
        success: false,
        error: 'Invalid pagination parameters'
      });
      return;
    }

    const result = await leadService.getAllLeads(
      { page, limit, stage, source, owner },
      req.user.id,
      req.user.role
    );

    res.status(200).json({
      success: true,
      data: result.leads,
      meta: result.meta
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : JSON.stringify(error);
    console.error('Error fetching leads:', errorMsg);
    res.status(500).json({
      success: false,
      error: errorMsg || 'Failed to fetch leads'
    });
  }
};

export const getLeadById = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;

    const lead = await leadService.getLeadById(Array.isArray(id) ? id[0] : id);

    if (!lead) {
      res.status(404).json({
        success: false,
        error: 'Lead not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: lead
    });
  } catch (error) {
    console.error('Error fetching lead:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch lead'
    });
  }
};

export const createLead = async (
  req: Request,
  res: Response
) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const validatedData = createLeadSchema.parse(req.body);

    const lead = await leadService.createLead(validatedData, req.user.id);

    res.status(201).json({
      success: true,
      data: lead
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: (error instanceof ZodError) ? error.issues : undefined
      });
      return;
    }

    // Handle duplicate company name error
    if (error instanceof Error && error.message.includes('already exists')) {
      res.status(409).json({
        success: false,
        error: error.message
      });
      return;
    }

    console.error('Error creating lead:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create lead'
    });
  }
};

export const updateLead = async (
  req: Request,
  res: Response
) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { id } = req.params;

    const existingLead = await leadService.getLeadById(Array.isArray(id) ? id[0] : id);
    if (!existingLead) {
      res.status(404).json({
        success: false,
        error: 'Lead not found'
      });
      return;
    }

    if (req.user.role !== 'admin' && 
        existingLead.owner_id !== req.user.id && 
        existingLead.created_by !== req.user.id) {
      res.status(403).json({
        success: false,
        error: 'Not authorized to update this lead'
      });
      return;
    }

    const validatedData = updateLeadSchema.parse(req.body);

    const lead = await leadService.updateLead(Array.isArray(id) ? id[0] : id, validatedData);

    res.status(200).json({
      success: true,
      data: lead
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: (error instanceof ZodError) ? error.issues : undefined
      });
      return;
    }

    // Handle duplicate company name error
    if (error instanceof Error && error.message.includes('already exists')) {
      res.status(409).json({
        success: false,
        error: error.message
      });
      return;
    }

    console.error('Error updating lead:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update lead'
    });
  }
};

export const updateLeadStage = async (
  req: Request,
  res: Response
) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { id } = req.params;

    const existingLead = await leadService.getLeadById(Array.isArray(id) ? id[0] : id);
    if (!existingLead) {
      res.status(404).json({
        success: false,
        error: 'Lead not found'
      });
      return;
    }

    if (req.user.role !== 'admin' && 
        existingLead.owner_id !== req.user.id && 
        existingLead.created_by !== req.user.id) {
      res.status(403).json({
        success: false,
        error: 'Not authorized to update this lead'
      });
      return;
    }

    const validatedData = updateLeadStageSchema.parse(req.body);

    const lead = await leadService.updateLeadStage(Array.isArray(id) ? id[0] : id, validatedData.stage);

    res.status(200).json({
      success: true,
      data: lead
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: (error instanceof ZodError) ? error.issues : undefined
      });
      return;
    }

    console.error('Error updating lead stage:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update lead stage'
    });
  }
};

export const deleteLead = async (
  req: Request,
  res: Response
) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { id } = req.params;

    const existingLead = await leadService.getLeadById(Array.isArray(id) ? id[0] : id);
    if (!existingLead) {
      res.status(404).json({
        success: false,
        error: 'Lead not found'
      });
      return;
    }

    if (req.user.role !== 'admin' && existingLead.created_by !== req.user.id) {
      res.status(403).json({
        success: false,
        error: 'Only admins or lead creators can delete leads'
      });
      return;
    }

    await leadService.deleteLead(Array.isArray(id) ? id[0] : id);

    res.status(200).json({
      success: true,
      message: 'Lead deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting lead:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete lead'
    });
  }
};

export const getLeadStats = async (
  req: Request,
  res: Response
) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const stats = await leadService.getLeadStats(req.user.id, req.user.role);

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching lead stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch lead stats'
    });
  }
};

export const getAssignableOwners = async (
  req: Request,
  res: Response
) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const owners = await leadService.getAssignableOwners();

    res.status(200).json({
      success: true,
      data: owners
    });
  } catch (error) {
    console.error('Error fetching assignable owners:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch assignable owners'
    });
  }
};
