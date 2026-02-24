import { Request, Response } from 'express';
import { ZodError } from 'zod';
import * as meetingService from '../services/meetingService.js';
import {
  createMeetingSchema,
  updateMeetingSchema,
  updateMeetingStatusSchema
} from '../validators/meeting.js';

export const getAllMeetings = async (
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
    const status = req.query.status as string | undefined;
    const assignedTo = req.query.assignedTo as string | undefined;
    const client = req.query.client as string | undefined;
    const lead = req.query.lead as string | undefined;
    const from = req.query.from as string | undefined;
    const to = req.query.to as string | undefined;
    const search = req.query.search as string | undefined;

    if (page < 1 || limit < 1 || limit > 100) {
      res.status(400).json({
        success: false,
        error: 'Invalid pagination parameters'
      });
      return;
    }

    const result = await meetingService.getAllMeetings(
      { page, limit, status, assignedTo, client, lead, from, to, search },
      req.user.id,
      req.user.role
    );

    res.status(200).json({
      success: true,
      data: result.meetings,
      meta: result.meta
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : JSON.stringify(error);
    console.error('Error fetching meetings:', errorMsg);
    res.status(500).json({
      success: false,
      error: errorMsg || 'Failed to fetch meetings'
    });
  }
};

export const getMeetingById = async (
  req: Request,
  res: Response
) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { id } = req.params;

    const meeting = await meetingService.getMeetingById(
      Array.isArray(id) ? id[0] : id,
      req.user.id,
      req.user.role
    );

    if (!meeting) {
      res.status(404).json({
        success: false,
        error: 'Meeting not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: meeting
    });
  } catch (error) {
    console.error('Error fetching meeting:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch meeting'
    });
  }
};

export const createMeeting = async (
  req: Request,
  res: Response
) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const validatedData = createMeetingSchema.parse(req.body);

    const meeting = await meetingService.createMeeting(validatedData, req.user.id);

    res.status(201).json({
      success: true,
      data: meeting
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.issues
      });
      return;
    }

    console.error('Error creating meeting:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create meeting'
    });
  }
};

export const updateMeeting = async (
  req: Request,
  res: Response
) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { id } = req.params;

    const validatedData = updateMeetingSchema.parse(req.body);

    const meeting = await meetingService.updateMeeting(
      Array.isArray(id) ? id[0] : id,
      validatedData,
      req.user.id,
      req.user.role
    );

    if (!meeting) {
      res.status(404).json({
        success: false,
        error: 'Meeting not found or access denied'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: meeting
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.issues
      });
      return;
    }

    console.error('Error updating meeting:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update meeting'
    });
  }
};

export const updateMeetingStatus = async (
  req: Request,
  res: Response
) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { id } = req.params;

    const validatedData = updateMeetingStatusSchema.parse(req.body);

    const meeting = await meetingService.updateMeetingStatus(
      Array.isArray(id) ? id[0] : id,
      validatedData.status,
      req.user.id,
      req.user.role
    );

    if (!meeting) {
      res.status(404).json({
        success: false,
        error: 'Meeting not found or access denied'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: meeting
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.issues
      });
      return;
    }

    console.error('Error updating meeting status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update meeting status'
    });
  }
};

export const deleteMeeting = async (
  req: Request,
  res: Response
) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { id } = req.params;

    const deleted = await meetingService.deleteMeeting(
      Array.isArray(id) ? id[0] : id,
      req.user.id,
      req.user.role
    );

    if (!deleted) {
      res.status(404).json({
        success: false,
        error: 'Meeting not found or access denied'
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Meeting deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting meeting:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete meeting'
    });
  }
};

export const getUpcomingMeetings = async (
  req: Request,
  res: Response
) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;

    const meetings = await meetingService.getUpcomingMeetings(
      req.user.id,
      req.user.role,
      limit
    );

    res.status(200).json({
      success: true,
      data: meetings
    });
  } catch (error) {
    console.error('Error fetching upcoming meetings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch upcoming meetings'
    });
  }
};

export const getCalendarMeetings = async (
  req: Request,
  res: Response
) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const from = req.query.from as string;
    const to = req.query.to as string;

    if (!from || !to) {
      res.status(400).json({
        success: false,
        error: 'Both from and to dates are required'
      });
      return;
    }

    const meetings = await meetingService.getMeetingsByDateRange(
      from,
      to,
      req.user.id,
      req.user.role
    );

    res.status(200).json({
      success: true,
      data: meetings
    });
  } catch (error) {
    console.error('Error fetching calendar meetings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch calendar meetings'
    });
  }
};

export const getTodaysMeetings = async (
  req: Request,
  res: Response
) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const meetings = await meetingService.getTodaysMeetings(
      req.user.id,
      req.user.role
    );

    res.status(200).json({
      success: true,
      data: meetings
    });
  } catch (error) {
    console.error('Error fetching today\'s meetings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch today\'s meetings'
    });
  }
};

export const getMeetingsByLead = async (
  req: Request,
  res: Response
) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { leadId } = req.params;

    const meetings = await meetingService.getMeetingsByLead(
      Array.isArray(leadId) ? leadId[0] : leadId,
      req.user.id,
      req.user.role
    );

    res.status(200).json({
      success: true,
      data: meetings
    });
  } catch (error) {
    console.error('Error fetching meetings by lead:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch meetings by lead'
    });
  }
};

export const getMeetingsByClient = async (
  req: Request,
  res: Response
) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { clientId } = req.params;

    const meetings = await meetingService.getMeetingsByClient(
      Array.isArray(clientId) ? clientId[0] : clientId,
      req.user.id,
      req.user.role
    );

    res.status(200).json({
      success: true,
      data: meetings
    });
  } catch (error) {
    console.error('Error fetching meetings by client:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch meetings by client'
    });
  }
};

export const getAssignableUsers = async (
  req: Request,
  res: Response
) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const users = await meetingService.getAssignableUsers();

    res.status(200).json({ success: true, data: users });
  } catch (error) {
    console.error('Error fetching assignable users:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch assignable users' });
  }
};
