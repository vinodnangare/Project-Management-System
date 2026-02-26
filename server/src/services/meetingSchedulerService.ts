import cron from 'node-cron';
import mongoose from 'mongoose';
import { Meeting } from '../models/Meeting.js';
import { RecurringMeetingTemplate, IRecurringMeetingTemplate } from '../models/RecurringMeetingTemplate.js';
import { MeetingActivity } from '../models/MeetingActivity.js';
import { MeetingStatus, MeetingRecurrence, MeetingActivityAction } from '../types/meeting.js';

const DAYS_AHEAD = 14;


const meetingExistsForDate = async (
  templateId: mongoose.Types.ObjectId,
  date: Date
): Promise<boolean> => {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const existingMeeting = await Meeting.findOne({
    recurringTemplateId: templateId,
    startTime: { $gte: startOfDay, $lte: endOfDay },
    is_deleted: false
  });

  return !!existingMeeting;
};

/**
 * Check if there's a conflict with existing meetings for the assigned users
 */
const hasConflict = async (
  assignedTo: mongoose.Types.ObjectId[],
  startTime: Date,
  endTime: Date
): Promise<boolean> => {
  const conflict = await Meeting.findOne({
    is_deleted: false,
    status: { $nin: [MeetingStatus.CANCELLED] },
    assignedTo: { $in: assignedTo },
    startTime: { $lt: endTime },
    endTime: { $gt: startTime }
  });

  return !!conflict;
};

/**
 * Creates a meeting instance from a template for a specific date
 */
const createMeetingFromTemplate = async (
  template: IRecurringMeetingTemplate,
  date: Date
): Promise<void> => {
  // Parse start and end times from template (format: "HH:mm")
  const [startHours, startMinutes] = template.startTime.split(':').map(Number);
  const [endHours, endMinutes] = template.endTime.split(':').map(Number);

  const startTime = new Date(date);
  startTime.setHours(startHours, startMinutes, 0, 0);

  const endTime = new Date(date);
  endTime.setHours(endHours, endMinutes, 0, 0);

  // If end time is before start time, it means meeting goes to next day
  if (endTime <= startTime) {
    endTime.setDate(endTime.getDate() + 1);
  }

  // Check for conflicts
  if (await hasConflict(template.assignedTo, startTime, endTime)) {
    console.log(`[MeetingScheduler] Skipping meeting "${template.title}" for ${date.toDateString()} - conflict detected`);
    return;
  }

  // Create the meeting
  const meeting = await Meeting.create({
    title: template.title,
    description: template.description,
    assignedTo: template.assignedTo,
    createdBy: template.createdBy,
    client: template.client,
    lead: template.lead,
    startTime,
    endTime,
    meetingType: template.meetingType,
    location: template.location,
    meetingLink: template.meetingLink,
    status: MeetingStatus.SCHEDULED,
    recurrence: template.recurrence,
    notes: template.notes,
    userNotes: [],
    recurringTemplateId: template._id,
    is_deleted: false
  });

  // Log activity
  await MeetingActivity.create({
    meeting_id: meeting._id,
    action: MeetingActivityAction.CREATED,
    old_value: null,
    new_value: `Auto-generated from recurring template: ${template.title}`,
    performed_by: template.createdBy
  });

  console.log(`[MeetingScheduler] Created meeting "${template.title}" for ${startTime.toISOString()}`);
};

/**
 * Gets the next dates that should have meetings generated for a template
 */
const getNextDates = (
  template: IRecurringMeetingTemplate,
  fromDate: Date,
  daysAhead: number
): Date[] => {
  const dates: Date[] = [];
  const today = new Date(fromDate);
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i <= daysAhead; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(today.getDate() + i);

    // Check if this date should have a meeting based on recurrence
    let shouldGenerate = false;

    switch (template.recurrence) {
      case 'daily':
        shouldGenerate = true;
        break;

      case 'weekly':
        // Check if the day of week matches
        shouldGenerate = checkDate.getDay() === template.dayOfWeek;
        break;

      case 'monthly':
        // Check if the day of month matches
        shouldGenerate = checkDate.getDate() === template.dayOfMonth;
        break;
    }

    // Check if we're past the end date
    if (template.endDate && checkDate > template.endDate) {
      break;
    }

    if (shouldGenerate) {
      dates.push(checkDate);
    }
  }

  return dates;
};

/**
 * Process a single recurring meeting template
 */
const processTemplate = async (template: IRecurringMeetingTemplate): Promise<void> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const nextDates = getNextDates(template, today, DAYS_AHEAD);

  for (const date of nextDates) {
    // Check if meeting already exists for this date
    if (await meetingExistsForDate(template._id, date)) {
      continue;
    }

    // Create meeting for this date
    await createMeetingFromTemplate(template, date);
  }

  // Update last generated date
  await RecurringMeetingTemplate.findByIdAndUpdate(template._id, {
    lastGeneratedDate: new Date()
  });
};

/**
 * Main function to generate recurring meetings
 */
export const generateRecurringMeetings = async (): Promise<void> => {
  console.log('[MeetingScheduler] Starting recurring meeting generation...');

  try {
    // Get all active recurring templates
    const templates = await RecurringMeetingTemplate.find({
      isActive: true,
      is_deleted: false
    });

    console.log(`[MeetingScheduler] Found ${templates.length} active recurring templates`);

    for (const template of templates) {
      try {
        await processTemplate(template);
      } catch (error) {
        console.error(`[MeetingScheduler] Error processing template ${template._id}:`, error);
      }
    }

    console.log('[MeetingScheduler] Recurring meeting generation completed');
  } catch (error) {
    console.error('[MeetingScheduler] Error generating recurring meetings:', error);
  }
};

/**
 * Initialize the cron job for generating recurring meetings
 * Runs every day at 00:05 (5 minutes past midnight)
 */
export const initMeetingScheduler = (): void => {
  // Run at 00:05 every day
  cron.schedule('5 0 * * *', async () => {
    console.log('[MeetingScheduler] Cron job triggered');
    await generateRecurringMeetings();
  });

  console.log('[MeetingScheduler] Cron job initialized - will run daily at 00:05');

  // Also run immediately on server start to catch up on any missed meetings
  setTimeout(async () => {
    console.log('[MeetingScheduler] Running initial meeting generation...');
    await generateRecurringMeetings();
  }, 5000); // Wait 5 seconds after server start
};

export default { generateRecurringMeetings, initMeetingScheduler };
