import mongoose from 'mongoose';
import { Meeting, IMeeting } from '../models/Meeting.js';
import { User } from '../models/index.js';
import { Lead } from '../models/Lead.js';
import { Meeting as MeetingType, MeetingStatus, MeetingAssignee } from '../types/meeting.js';
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
    notes: meeting.notes || null,
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
    const conditions: any = {
      _id: new mongoose.Types.ObjectId(meetingId),
      is_deleted: false
    };

    // Role-based access
    if (userRole === 'employee') {
      conditions.assignedTo = { $in: [new mongoose.Types.ObjectId(userId)] };
    }

    const meeting = await Meeting.findOne(conditions);

    if (!meeting) return null;

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
  const meeting = await Meeting.create({
    title: meetingData.title,
    description: meetingData.description || null,
    assignedTo: meetingData.assignedTo.map(id => new mongoose.Types.ObjectId(id)),
    createdBy: new mongoose.Types.ObjectId(createdBy),
    client: meetingData.client ? new mongoose.Types.ObjectId(meetingData.client) : null,
    lead: meetingData.lead ? new mongoose.Types.ObjectId(meetingData.lead) : null,
    startTime: meetingData.startTime,
    endTime: meetingData.endTime,
    meetingType: meetingData.meetingType,
    location: meetingData.location || null,
    meetingLink: meetingData.meetingLink || null,
    status: meetingData.status || 'scheduled',
    notes: meetingData.notes || null,
    is_deleted: false
  });

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

    const updateData: any = {};
    
    if (meetingData.title !== undefined) updateData.title = meetingData.title;
    if (meetingData.description !== undefined) updateData.description = meetingData.description;
    if (meetingData.assignedTo !== undefined) {
      updateData.assignedTo = meetingData.assignedTo.map(id => new mongoose.Types.ObjectId(id));
    }
    if (meetingData.client !== undefined) {
      updateData.client = meetingData.client ? new mongoose.Types.ObjectId(meetingData.client) : null;
    }
    if (meetingData.lead !== undefined) {
      updateData.lead = meetingData.lead ? new mongoose.Types.ObjectId(meetingData.lead) : null;
    }
    if (meetingData.startTime !== undefined) updateData.startTime = meetingData.startTime;
    if (meetingData.endTime !== undefined) updateData.endTime = meetingData.endTime;
    if (meetingData.meetingType !== undefined) updateData.meetingType = meetingData.meetingType;
    if (meetingData.location !== undefined) updateData.location = meetingData.location;
    if (meetingData.meetingLink !== undefined) updateData.meetingLink = meetingData.meetingLink;
    if (meetingData.status !== undefined) updateData.status = meetingData.status;
    if (meetingData.notes !== undefined) updateData.notes = meetingData.notes;

    const meeting = await Meeting.findByIdAndUpdate(
      meetingId,
      updateData,
      { new: true }
    );

    if (!meeting) return null;

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
