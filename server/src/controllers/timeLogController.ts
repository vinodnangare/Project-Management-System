import { Request, Response } from 'express';
import { ZodError } from 'zod';
import * as timeLogService from '../services/timeLogService.js';
import { ApiResponse } from '../types/index.js';

export const logTime = async (
  req: Request,
  res: Response<ApiResponse<any>>
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { date, hours_worked, task_id, description } = req.body;

    if (!date || hours_worked === undefined) {
      res.status(400).json({
        success: false,
        error: 'date and hours_worked are required'
      });
      return;
    }

    const timeLog = await timeLogService.logTime(req.user.id, {
      date,
      hours_worked: parseFloat(hours_worked),
      task_id: task_id || null,
      description: description || null
    });

    res.status(201).json({
      success: true,
      data: timeLog
    });
  } catch (error) {
    console.error('Error logging time:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to log time'
    });
  }
};

export const getUserTimeLogs = async (
  req: Request,
  res: Response<ApiResponse<any>>
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      res.status(400).json({
        success: false,
        error: 'startDate and endDate query parameters are required'
      });
      return;
    }

    const timeLogs = await timeLogService.getUserTimeLogs(
      req.user.id,
      startDate as string,
      endDate as string
    );

    res.status(200).json({
      success: true,
      data: timeLogs
    });
  } catch (error) {
    console.error('Error fetching time logs:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch time logs'
    });
  }
};

export const getTimeLogByUserAndDate = async (
  req: Request,
  res: Response<ApiResponse<any>>
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { date } = req.query;

    if (!date) {
      res.status(400).json({
        success: false,
        error: 'date query parameter is required'
      });
      return;
    }

    const timeLog = await timeLogService.getTimeLogByUserAndDate(
      req.user.id,
      date as string
    );

    if (!timeLog) {
      res.status(404).json({
        success: false,
        error: 'Time log not found for the specified date'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: timeLog
    });
  } catch (error) {
    console.error('Error fetching time log:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch time log'
    });
  }
};

export const getTimeLogsByDate = async (
  req: Request,
  res: Response<ApiResponse<any>>
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    if (req.user.role !== 'admin') {
      res.status(403).json({
        success: false,
        error: 'Only admins can view all time logs'
      });
      return;
    }

    const { date } = req.query;

    if (!date) {
      res.status(400).json({
        success: false,
        error: 'date query parameter is required'
      });
      return;
    }

    const timeLogs = await timeLogService.getTimeLogsByDate(date as string);

    res.status(200).json({
      success: true,
      data: timeLogs
    });
  } catch (error) {
    console.error('Error fetching time logs:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch time logs'
    });
  }
};
