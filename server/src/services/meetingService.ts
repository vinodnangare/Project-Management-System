import mongoose from 'mongoose';
import { Meeting, IMeeting } from '../models/Meeting.js';
import { MeetingActivity } from '../models/MeetingActivity.js';
import { RecurringMeetingTemplate } from '../models/RecurringMeetingTemplate.js';
import { User } from '../models/index.js';
import { Lead } from '../models/Lead.js';
import {
  Meeting as MeetingType,
  MeetingStatus,
  MeetingAssignee,
  UserNote,
  MeetingRecurrence,
  MeetingActivity as MeetingActivityType,
  MeetingActivityAction
} from '../types/meeting.js';
import { PaginationMeta } from '../types/index.js';
import { CreateMeetingRequest, UpdateMeetingRequest } from '../validators/meeting.js';

interface QueryOptions {
  page?: number;
  limit?: number;
  status?: string;
  assignedTo?: string;
  client?: string;
  lead?: string;
  from?: string;
  to?: string;
  search?: string;
}

interface MeetingSlot {
  startTime: Date;
  endTime: Date;
}

const RECURRENCE_OCCURRENCES: Record<MeetingRecurrence, number> = {
  [MeetingRecurrence.ONCE]: 1,
  [MeetingRecurrence.DAILY]: 365,
  [MeetingRecurrence.WEEKLY]: 104,
  [MeetingRecurrence.MONTHLY]: 36
};

export class MeetingConflictError extends Error {
  statusCode = 409;
}

const hasTimeOverlap = (aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean =>
  aStart < bEnd && aEnd > bStart;

const addRecurrenceStep = (date: Date, recurrence: MeetingRecurrence): Date => {
  const next = new Date(date);

  switch (recurrence) {
    case MeetingRecurrence.DAILY:
      next.setDate(next.getDate() + 1);
      return next;
    case MeetingRecurrence.WEEKLY:
      next.setDate(next.getDate() + 7);
      return next;
    case MeetingRecurrence.MONTHLY:
      next.setMonth(next.getMonth() + 1);
      return next;
    default:
      return next;
  }
};

const buildMeetingSlots = (
  startTime: Date,
  endTime: Date,
  recurrence: MeetingRecurrence,
  includeFirst: boolean = true
): MeetingSlot[] => {
  const slots: MeetingSlot[] = [];
  const occurrences = RECURRENCE_OCCURRENCES[recurrence] || 1;

  let currentStart = new Date(startTime);
  let currentEnd = new Date(endTime);

  if (includeFirst) {
    slots.push({ startTime: new Date(currentStart), endTime: new Date(currentEnd) });
  }

  for (let index = 1; index < occurrences; index++) {
    currentStart = addRecurrenceStep(currentStart, recurrence);
    currentEnd = addRecurrenceStep(currentEnd, recurrence);
    slots.push({ startTime: new Date(currentStart), endTime: new Date(currentEnd) });
  }

  return slots;
};

const resolveAssigneeNames = async (ids: string[]): Promise<string[]> => {
  if (!ids.length) return [];

  const users = await User.find({ _id: { $in: ids.map((id) => new mongoose.Types.ObjectId(id)) } }).select('full_name email');
  return users.map((user) => user.full_name || user.email || user._id.toString());
};

const validateNoAssigneeConflicts = async (
  assignedTo: string[],
  slot: MeetingSlot,
  excludeMeetingId?: string
): Promise<void> => {
  if (!assignedTo.length) return;

  const assignedObjectIds = assignedTo.map((id) => new mongoose.Types.ObjectId(id));
  const conditions: any = {
    is_deleted: false,
    status: { $nin: [MeetingStatus.CANCELLED] },
    assignedTo: { $in: assignedObjectIds },
    startTime: { $lt: slot.endTime },
    endTime: { $gt: slot.startTime }
  };

  if (excludeMeetingId) {
    conditions._id = { $ne: new mongoose.Types.ObjectId(excludeMeetingId) };
  }

  const conflictingMeeting = await Meeting.findOne(conditions).select('startTime endTime assignedTo');
  if (!conflictingMeeting) return;

  const conflictingAssignees = conflictingMeeting.assignedTo
    .map((id) => id.toString())
    .filter((id) => assignedTo.includes(id));
  const assigneeNames = await resolveAssigneeNames(conflictingAssignees);
  const assigneeText = assigneeNames.length > 0 ? assigneeNames.join(', ') : 'One or more selected participants';

  throw new MeetingConflictError(
    `${assigneeText} already has a meeting between ${slot.startTime.toISOString()} and ${slot.endTime.toISOString()}`
  );
};

const logMeetingActivity = async (data: {
  meeting_id: string;
  action: MeetingActivityAction;
  old_value: string | null;
  new_value: string | null;
  performed_by: string;
}): Promise<void> => {
  await MeetingActivity.create({
    meeting_id: new mongoose.Types.ObjectId(data.meeting_id),
    action: data.action,
    old_value: data.old_value,
    new_value: data.new_value,
    performed_by: new mongoose.Types.ObjectId(data.performed_by)
  });
};

const formatMeetingResponse = async (meeting: IMeeting): Promise<MeetingType> => {
  // Fetch all assigned users
  const assignedUsers = await User.find({ _id: { $in: meeting.assignedTo } });
  const assignees: MeetingAssignee[] = assignedUsers.map(user => ({
    id: user._id.toString(),
    full_name: user.full_name,
    email: user.email
  }));
  
  const creator = await User.findById(meeting.createdBy);
  const linkedLead = meeting.lead ? await Lead.findById(meeting.lead) : null;

  // Format userNotes with user names
  const userNotes: UserNote[] = [];
  if (meeting.userNotes && meeting.userNotes.length > 0) {
    const userIds = meeting.userNotes.map(n => n.userId);
    const noteUsers = await User.find({ _id: { $in: userIds } });
    const userMap = new Map(noteUsers.map(u => [u._id.toString(), u.full_name]));
    
    for (const note of meeting.userNotes) {
      userNotes.push({
        userId: note.userId.toString(),
        userName: userMap.get(note.userId.toString()) || 'Unknown User',
        content: note.content,
        updatedAt: note.updatedAt.toISOString()
      });
    }
  }

  return {
    id: meeting._id.toString(),
    title: meeting.title,
    description: meeting.description || null,
    assignedTo: meeting.assignedTo.map(id => id.toString()),
    assignees,
    createdBy: meeting.createdBy.toString(),
    createdBy_name: creator?.full_name || null,
    createdBy_email: creator?.email || null,
    client: meeting.client?.toString() || null,
    client_name: null, // Client model not implemented yet
    lead: meeting.lead?.toString() || null,
    lead_company_name: linkedLead?.company_name || null,
    startTime: meeting.startTime.toISOString(),
    endTime: meeting.endTime.toISOString(),
    meetingType: meeting.meetingType as any,
    location: meeting.location || null,
    meetingLink: meeting.meetingLink || null,
    status: meeting.status as MeetingStatus,
    recurrence: (meeting.recurrence || MeetingRecurrence.ONCE) as MeetingRecurrence,
    recurringTemplateId: meeting.recurringTemplateId?.toString() || null,
    notes: meeting.notes || null,
    userNotes,
    is_deleted: meeting.is_deleted,
    created_at: meeting.created_at.toISOString(),
    updated_at: meeting.updated_at.toISOString()
  };
};

export const getAllMeetings = async (
  options: QueryOptions,
  userId: string,
  userRole: string
): Promise<{ meetings: MeetingType[]; meta: PaginationMeta }> => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      assignedTo, 
      client, 
      lead, 
      from, 
      to, 
      search 
    } = options;
    const skip = (page - 1) * limit;

    const conditions: any = { is_deleted: false };

    // Role-based filtering
    if (userRole === 'employee') {
      // Employees can only see meetings they are assigned to
      conditions.assignedTo = { $in: [new mongoose.Types.ObjectId(userId)] };
    } else if (userRole === 'manager') {
      // Managers can see their own meetings and meetings of their team
      // For now, managers see all meetings (can be refined with team logic)
    }
    // Admin sees all meetings

    // Apply filters
    if (status) conditions.status = status;
    if (assignedTo) conditions.assignedTo = { $in: [new mongoose.Types.ObjectId(assignedTo)] };
    if (client) conditions.client = new mongoose.Types.ObjectId(client);
    if (lead) conditions.lead = new mongoose.Types.ObjectId(lead);

    // Date range filter
    if (from || to) {
      conditions.startTime = {};
      if (from) conditions.startTime.$gte = new Date(from);
      if (to) conditions.startTime.$lte = new Date(to);
    }

    // Search filter
    if (search) {
      conditions.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await Meeting.countDocuments(conditions);

    const meetings = await Meeting.find(conditions)
      .sort({ startTime: 1 })
      .skip(skip)
      .limit(limit);

    const formattedMeetings = await Promise.all(meetings.map(formatMeetingResponse));

    return {
      meetings: formattedMeetings,
      meta: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    console.error('getAllMeetings error:', error);
    throw error;
  }
};

export const getMeetingById = async (
  meetingId: string,
  userId: string,
  userRole: string
): Promise<MeetingType | null> => {
  try {
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(meetingId)) {
      console.warn(`Invalid meeting ID format: ${meetingId}`);
      return null;
    }

    const conditions: any = {
      _id: new mongoose.Types.ObjectId(meetingId),
      is_deleted: false
    };

    // Role-based access
    if (userRole === 'employee') {
      conditions.assignedTo = { $in: [new mongoose.Types.ObjectId(userId)] };
    }

    const meeting = await Meeting.findOne(conditions);

    if (!meeting) {
      // Log why meeting wasn't found (for debugging)
      const deletedMeeting = await Meeting.findById(new mongoose.Types.ObjectId(meetingId));
      if (deletedMeeting?.is_deleted) {
        console.log(`Meeting ${meetingId} is deleted`);
      } else if (userRole === 'employee' && deletedMeeting) {
        console.log(`Employee ${userId} not assigned to meeting ${meetingId}`);
      } else {
        console.log(`Meeting ${meetingId} not found in database`);
      }
      return null;
    }

    return formatMeetingResponse(meeting);
  } catch (error) {
    console.error('getMeetingById error:', error);
    return null;
  }
};

export const createMeeting = async (
  meetingData: CreateMeetingRequest,
  createdBy: string
): Promise<MeetingType> => {
  const recurrence = (meetingData.recurrence || MeetingRecurrence.ONCE) as MeetingRecurrence;
  const startTime = new Date(meetingData.startTime);
  const endTime = new Date(meetingData.endTime);
  
  // Calculate duration in minutes
  const durationMs = endTime.getTime() - startTime.getTime();
  const durationMinutes = Math.floor(durationMs / 60000);

  // Validate first occurrence has no conflicts
  await validateNoAssigneeConflicts(meetingData.assignedTo, { startTime, endTime });

  let recurringTemplateId: mongoose.Types.ObjectId | null = null;

  // For recurring meetings, create a template
  if (recurrence !== MeetingRecurrence.ONCE) {
    // Extract time in HH:mm format
    const startTimeStr = `${String(startTime.getHours()).padStart(2, '0')}:${String(startTime.getMinutes()).padStart(2, '0')}`;
    const endTimeStr = `${String(endTime.getHours()).padStart(2, '0')}:${String(endTime.getMinutes()).padStart(2, '0')}`;

    const template = await RecurringMeetingTemplate.create({
      title: meetingData.title,
      description: meetingData.description || null,
      assignedTo: meetingData.assignedTo.map((id) => new mongoose.Types.ObjectId(id)),
      createdBy: new mongoose.Types.ObjectId(createdBy),
      client: meetingData.client ? new mongoose.Types.ObjectId(meetingData.client) : null,
      lead: meetingData.lead ? new mongoose.Types.ObjectId(meetingData.lead) : null,
      startTime: startTimeStr,
      endTime: endTimeStr,
      duration: durationMinutes,
      meetingType: meetingData.meetingType,
      location: meetingData.location || null,
      meetingLink: meetingData.meetingLink || null,
      notes: meetingData.notes || null,
      recurrence: recurrence,
      dayOfWeek: recurrence === MeetingRecurrence.WEEKLY ? startTime.getDay() : null,
      dayOfMonth: recurrence === MeetingRecurrence.MONTHLY ? startTime.getDate() : null,
      lastGeneratedDate: new Date(),
      isActive: true,
      is_deleted: false
    });

    recurringTemplateId = template._id;
    console.log(`[MeetingService] Created recurring template ${template._id} for ${recurrence} meetings`);
  }

  // Create the first meeting instance
  const meeting = await Meeting.create({
    title: meetingData.title,
    description: meetingData.description || null,
    assignedTo: meetingData.assignedTo.map((id) => new mongoose.Types.ObjectId(id)),
    createdBy: new mongoose.Types.ObjectId(createdBy),
    client: meetingData.client ? new mongoose.Types.ObjectId(meetingData.client) : null,
    lead: meetingData.lead ? new mongoose.Types.ObjectId(meetingData.lead) : null,
    startTime,
    endTime,
    meetingType: meetingData.meetingType,
    location: meetingData.location || null,
    meetingLink: meetingData.meetingLink || null,
    status: meetingData.status || MeetingStatus.SCHEDULED,
    recurrence,
    recurringTemplateId,
    notes: meetingData.notes || null,
    userNotes: [],
    is_deleted: false
  });

  await logMeetingActivity({
    meeting_id: meeting._id.toString(),
    action: MeetingActivityAction.CREATED,
    old_value: null,
    new_value: recurrence === MeetingRecurrence.ONCE 
      ? meeting.title 
      : `${meeting.title} (Recurring: ${recurrence})`,
    performed_by: createdBy
  }).catch(console.error);

  return formatMeetingResponse(meeting);
};

export const updateMeeting = async (
  meetingId: string,
  meetingData: UpdateMeetingRequest,
  userId: string,
  userRole: string
): Promise<MeetingType | null> => {
  try {
    const conditions: any = {
      _id: new mongoose.Types.ObjectId(meetingId),
      is_deleted: false
    };

    // Role-based access: only assigned user or admin can update
    if (userRole === 'employee') {
      conditions.assignedTo = { $in: [new mongoose.Types.ObjectId(userId)] };
    }

    const existingMeeting = await Meeting.findOne(conditions);
    if (!existingMeeting) return null;

    const existingAssignedTo = existingMeeting.assignedTo.map((id) => id.toString());
    const nextAssignedTo = meetingData.assignedTo ?? existingAssignedTo;
    const nextStartTime = meetingData.startTime ?? existingMeeting.startTime;
    const nextEndTime = meetingData.endTime ?? existingMeeting.endTime;
    const nextRecurrence = (meetingData.recurrence ??
      existingMeeting.recurrence ??
      MeetingRecurrence.ONCE) as MeetingRecurrence;

    if (nextStartTime >= nextEndTime) {
      throw new Error('Start time must be before end time');
    }

    const shouldValidateConflict =
      meetingData.assignedTo !== undefined ||
      meetingData.startTime !== undefined ||
      meetingData.endTime !== undefined;

    if (shouldValidateConflict) {
      await validateNoAssigneeConflicts(
        nextAssignedTo,
        { startTime: nextStartTime, endTime: nextEndTime },
        meetingId
      );
    }

    const updateData: any = {};
    const activityPromises: Array<Promise<void>> = [];

    const queueActivity = (
      action: MeetingActivityAction,
      oldValue: string | null,
      newValue: string | null
    ) => {
      if (oldValue === newValue) return;
      activityPromises.push(
        logMeetingActivity({
          meeting_id: meetingId,
          action,
          old_value: oldValue,
          new_value: newValue,
          performed_by: userId
        }).catch(console.error)
      );
    };
    
    if (meetingData.title !== undefined) {
      updateData.title = meetingData.title;
      queueActivity(MeetingActivityAction.TITLE_CHANGED, existingMeeting.title, meetingData.title);
    }
    if (meetingData.description !== undefined) {
      updateData.description = meetingData.description;
      queueActivity(
        MeetingActivityAction.DESCRIPTION_CHANGED,
        existingMeeting.description || null,
        meetingData.description || null
      );
    }
    if (meetingData.assignedTo !== undefined) {
      updateData.assignedTo = meetingData.assignedTo.map((id) => new mongoose.Types.ObjectId(id));
      queueActivity(
        MeetingActivityAction.ASSIGNEES_CHANGED,
        existingAssignedTo.sort().join(','),
        [...meetingData.assignedTo].sort().join(',')
      );
    }
    if (meetingData.client !== undefined) {
      updateData.client = meetingData.client ? new mongoose.Types.ObjectId(meetingData.client) : null;
    }
    if (meetingData.lead !== undefined) {
      updateData.lead = meetingData.lead ? new mongoose.Types.ObjectId(meetingData.lead) : null;
    }
    if (meetingData.startTime !== undefined || meetingData.endTime !== undefined) {
      if (meetingData.startTime !== undefined) updateData.startTime = meetingData.startTime;
      if (meetingData.endTime !== undefined) updateData.endTime = meetingData.endTime;
      queueActivity(
        MeetingActivityAction.TIME_CHANGED,
        `${existingMeeting.startTime.toISOString()} - ${existingMeeting.endTime.toISOString()}`,
        `${nextStartTime.toISOString()} - ${nextEndTime.toISOString()}`
      );
    }
    if (meetingData.meetingType !== undefined) {
      updateData.meetingType = meetingData.meetingType;
      queueActivity(MeetingActivityAction.TYPE_CHANGED, existingMeeting.meetingType, meetingData.meetingType);
    }
    if (meetingData.location !== undefined) {
      updateData.location = meetingData.location;
      queueActivity(
        MeetingActivityAction.LOCATION_CHANGED,
        existingMeeting.location || null,
        meetingData.location || null
      );
    }
    if (meetingData.meetingLink !== undefined) {
      updateData.meetingLink = meetingData.meetingLink;
      queueActivity(
        MeetingActivityAction.LINK_CHANGED,
        existingMeeting.meetingLink || null,
        meetingData.meetingLink || null
      );
    }
    if (meetingData.status !== undefined) {
      updateData.status = meetingData.status;
      queueActivity(MeetingActivityAction.STATUS_CHANGED, existingMeeting.status, meetingData.status);
    }
    if (meetingData.recurrence !== undefined) {
      updateData.recurrence = meetingData.recurrence;
      queueActivity(
        MeetingActivityAction.RECURRENCE_CHANGED,
        existingMeeting.recurrence || MeetingRecurrence.ONCE,
        meetingData.recurrence
      );
    }
    
    // Handle notes based on role
    // Admin notes (universal): only admin can update
    if (meetingData.notes !== undefined && userRole === 'admin') {
      updateData.notes = meetingData.notes;
      queueActivity(
        MeetingActivityAction.NOTES_UPDATED,
        existingMeeting.notes || null,
        meetingData.notes || null
      );
    }
    
    // Handle user-specific notes (for any user - employees and admins can save their own notes)
    if (meetingData.userNote !== undefined) {
      const userNoteContent = meetingData.userNote;
      const userIdObj = new mongoose.Types.ObjectId(userId);
      
      // Clone existing notes array to avoid mutation issues
      const existingUserNotes = [...(existingMeeting.userNotes || [])];
      const existingNoteIndex = existingUserNotes.findIndex(
        n => n.userId.toString() === userId
      );
      const previousUserNote = existingNoteIndex >= 0 ? existingUserNotes[existingNoteIndex].content : null;
      
      if (userNoteContent !== null && userNoteContent.trim() !== '') {
        if (existingNoteIndex >= 0) {
          // Update existing note
          existingUserNotes[existingNoteIndex] = {
            userId: userIdObj,
            content: userNoteContent,
            updatedAt: new Date()
          };
        } else {
          // Add new note
          existingUserNotes.push({
            userId: userIdObj,
            content: userNoteContent,
            updatedAt: new Date()
          });
        }
        updateData.userNotes = existingUserNotes;
        queueActivity(MeetingActivityAction.PERSONAL_NOTE_UPDATED, previousUserNote, userNoteContent);
      } else if (existingNoteIndex >= 0) {
        // Only remove note if it was explicitly cleared (null or empty string)
        existingUserNotes.splice(existingNoteIndex, 1);
        updateData.userNotes = existingUserNotes;
        queueActivity(MeetingActivityAction.PERSONAL_NOTE_UPDATED, previousUserNote, null);
      }
    }

    const meeting = await Meeting.findByIdAndUpdate(
      meetingId,
      updateData,
      { new: true }
    );

    if (!meeting) return null;

    const shouldCreateFutureInstances =
      meetingData.recurrence !== undefined &&
      existingMeeting.recurrence === MeetingRecurrence.ONCE &&
      meetingData.recurrence !== MeetingRecurrence.ONCE;

    if (shouldCreateFutureInstances) {
      const recurrence = meetingData.recurrence as MeetingRecurrence;
      const futureSlots = buildMeetingSlots(nextStartTime, nextEndTime, recurrence, true).slice(1);
      for (const slot of futureSlots) {
        await validateNoAssigneeConflicts(nextAssignedTo, slot);
      }

      if (futureSlots.length > 0) {
        await Meeting.insertMany(
          futureSlots.map((slot) => ({
            title: meeting.title,
            description: meeting.description || null,
            assignedTo: meeting.assignedTo,
            createdBy: meeting.createdBy,
            client: meeting.client || null,
            lead: meeting.lead || null,
            startTime: slot.startTime,
            endTime: slot.endTime,
            meetingType: meeting.meetingType,
            location: meeting.location || null,
            meetingLink: meeting.meetingLink || null,
            status: meeting.status || MeetingStatus.SCHEDULED,
            recurrence: recurrence,
            notes: meeting.notes || null,
            userNotes: [],
            is_deleted: false
          }))
        );
      }
    }

    await Promise.all(activityPromises);

    return formatMeetingResponse(meeting);
  } catch (error) {
    console.error('updateMeeting error:', error);
    throw error;
  }
};

export const updateMeetingStatus = async (
  meetingId: string,
  status: string,
  userId: string,
  userRole: string
): Promise<MeetingType | null> => {
  try {
    const conditions: any = {
      _id: new mongoose.Types.ObjectId(meetingId),
      is_deleted: false
    };

    // Role-based access
    if (userRole === 'employee') {
      conditions.assignedTo = { $in: [new mongoose.Types.ObjectId(userId)] };
    }

    const meeting = await Meeting.findOneAndUpdate(
      conditions,
      { status },
      { new: true }
    );

    if (!meeting) return null;

    await logMeetingActivity({
      meeting_id: meeting._id.toString(),
      action: MeetingActivityAction.STATUS_CHANGED,
      old_value: null,
      new_value: status,
      performed_by: userId
    }).catch(console.error);

    return formatMeetingResponse(meeting);
  } catch (error) {
    console.error('updateMeetingStatus error:', error);
    throw error;
  }
};

export const deleteMeeting = async (
  meetingId: string,
  userId: string,
  userRole: string
): Promise<boolean> => {
  try {
    const conditions: any = {
      _id: new mongoose.Types.ObjectId(meetingId),
      is_deleted: false
    };

    // Only admin can delete, or the creator/assigned user
    if (userRole === 'employee') {
      conditions.$or = [
        { createdBy: new mongoose.Types.ObjectId(userId) },
        { assignedTo: { $in: [new mongoose.Types.ObjectId(userId)] } }
      ];
    }

    const result = await Meeting.findOneAndUpdate(
      conditions,
      { is_deleted: true },
      { new: true }
    );

    if (result) {
      await logMeetingActivity({
        meeting_id: result._id.toString(),
        action: MeetingActivityAction.DELETED,
        old_value: 'active',
        new_value: 'deleted',
        performed_by: userId
      }).catch(console.error);
    }

    return !!result;
  } catch (error) {
    console.error('deleteMeeting error:', error);
    throw error;
  }
};

export const getUpcomingMeetings = async (
  userId: string,
  userRole: string,
  limitCount: number = 5
): Promise<MeetingType[]> => {
  try {
    const now = new Date();
    const conditions: any = {
      is_deleted: false,
      startTime: { $gte: now },
      status: { $in: ['scheduled', 'rescheduled'] }
    };

    // Role-based filtering
    if (userRole === 'employee') {
      conditions.assignedTo = { $in: [new mongoose.Types.ObjectId(userId)] };
    }

    const meetings = await Meeting.find(conditions)
      .sort({ startTime: 1 })
      .limit(limitCount);

    return Promise.all(meetings.map(formatMeetingResponse));
  } catch (error) {
    console.error('getUpcomingMeetings error:', error);
    throw error;
  }
};

export const getMeetingsByDateRange = async (
  startDate: string,
  endDate: string,
  userId: string,
  userRole: string
): Promise<MeetingType[]> => {
  try {
    const conditions: any = {
      is_deleted: false,
      startTime: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };

    // Role-based filtering
    if (userRole === 'employee') {
      conditions.assignedTo = { $in: [new mongoose.Types.ObjectId(userId)] };
    }

    const meetings = await Meeting.find(conditions)
      .sort({ startTime: 1 });

    return Promise.all(meetings.map(formatMeetingResponse));
  } catch (error) {
    console.error('getMeetingsByDateRange error:', error);
    throw error;
  }
};

export const getTodaysMeetings = async (
  userId: string,
  userRole: string
): Promise<MeetingType[]> => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const conditions: any = {
      is_deleted: false,
      startTime: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    };

    // Role-based filtering
    if (userRole === 'employee') {
      conditions.assignedTo = { $in: [new mongoose.Types.ObjectId(userId)] };
    }

    const meetings = await Meeting.find(conditions)
      .sort({ startTime: 1 });

    return Promise.all(meetings.map(formatMeetingResponse));
  } catch (error) {
    console.error('getTodaysMeetings error:', error);
    throw error;
  }
};

export const getMeetingsByLead = async (
  leadId: string,
  userId: string,
  userRole: string
): Promise<MeetingType[]> => {
  try {
    const conditions: any = {
      is_deleted: false,
      lead: new mongoose.Types.ObjectId(leadId)
    };

    // Role-based filtering
    if (userRole === 'employee') {
      conditions.assignedTo = { $in: [new mongoose.Types.ObjectId(userId)] };
    }

    const meetings = await Meeting.find(conditions)
      .sort({ startTime: -1 });

    return Promise.all(meetings.map(formatMeetingResponse));
  } catch (error) {
    console.error('getMeetingsByLead error:', error);
    throw error;
  }
};

export const getMeetingsByClient = async (
  clientId: string,
  userId: string,
  userRole: string
): Promise<MeetingType[]> => {
  try {
    const conditions: any = {
      is_deleted: false,
      client: new mongoose.Types.ObjectId(clientId)
    };

    // Role-based filtering
    if (userRole === 'employee') {
      conditions.assignedTo = { $in: [new mongoose.Types.ObjectId(userId)] };
    }

    const meetings = await Meeting.find(conditions)
      .sort({ startTime: -1 });

    return Promise.all(meetings.map(formatMeetingResponse));
  } catch (error) {
    console.error('getMeetingsByClient error:', error);
    throw error;
  }
};

export const getMeetingActivities = async (
  meetingId: string
): Promise<MeetingActivityType[]> => {
  const activities = await MeetingActivity.find({
    meeting_id: new mongoose.Types.ObjectId(meetingId)
  })
    .populate('performed_by', 'full_name email')
    .sort({ created_at: -1 });

  return activities.map((activity) => ({
    id: activity._id.toString(),
    meeting_id: meetingId,
    action: activity.action as MeetingActivityAction,
    old_value: activity.old_value || null,
    new_value: activity.new_value || null,
    performed_by: activity.performed_by._id.toString(),
    performed_by_name: (activity.performed_by as any).full_name || null,
    performed_by_email: (activity.performed_by as any).email || null,
    created_at: activity.created_at.toISOString()
  }));
};

export const getAssignableUsers = async (): Promise<Array<{ id: string; full_name: string; email: string }>> => {
  const users = await User.find({
    role: { $in: ['employee', 'manager', 'admin'] },
    is_active: true
  }).select('full_name email');

  return users.map(user => ({
    id: user._id.toString(),
    full_name: user.full_name,
    email: user.email
  }));
};
