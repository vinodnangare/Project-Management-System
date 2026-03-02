import { Request, Response } from 'express';
import { LeadStage } from '../models/LeadStage.js';

export const getLeadStages = async (req: Request, res: Response): Promise<void> => {
  try {
    let stages = await LeadStage.find().sort({ sequence: 1 });
    
    if (stages.length === 0) {
      const defaultStages = [
        { name: 'new', sequence: 1, color: '#3B82F6', is_default: true },
        { name: 'in_discussion', sequence: 2, color: '#F59E0B', is_default: true },
        { name: 'quoted', sequence: 3, color: '#8B5CF6', is_default: true },
        { name: 'won', sequence: 4, color: '#10B981', is_default: true },
        { name: 'lost', sequence: 5, color: '#EF4444', is_default: true }
      ];
      stages = await LeadStage.insertMany(defaultStages);
    }
    
    res.status(200).json({ success: true, data: stages });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

export const createLeadStage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, sequence, color } = req.body;
    
    if (!name || sequence === undefined) {
      res.status(400).json({ success: false, error: 'Name and sequence are required' });
      return;
    }

    const newStage = await LeadStage.create({
      name,
      sequence,
      color: color || '#3B82F6'
    });

    res.status(201).json({ success: true, data: newStage });
  } catch (error: any) {
    if (error.code === 11000) {
      res.status(400).json({ success: false, error: 'Stage name already exists' });
      return;
    }
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

export const updateLeadStage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, sequence, color } = req.body;
    const stageId = req.params.id;

    const stage = await LeadStage.findById(stageId);
    if (!stage) {
      res.status(404).json({ success: false, error: 'Stage not found' });
      return;
    }

    if (name) stage.name = name;
    if (sequence !== undefined) stage.sequence = sequence;
    if (color) stage.color = color;

    await stage.save();

    res.status(200).json({ success: true, data: stage });
  } catch (error: any) {
    if (error.code === 11000) {
      res.status(400).json({ success: false, error: 'Stage name already exists' });
      return;
    }
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

export const deleteLeadStage = async (req: Request, res: Response): Promise<void> => {
  try {
    const stageId = req.params.id;

    const stage = await LeadStage.findById(stageId);
    if (!stage) {
      res.status(404).json({ success: false, error: 'Stage not found' });
      return;
    }

    if (stage.is_default) {
      res.status(400).json({ success: false, error: 'Cannot delete a default stage' });
      return;
    }

    await stage.deleteOne();

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};
