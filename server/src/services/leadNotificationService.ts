import type { LeadStage } from '../types/lead.js';

export interface LeadNotification {
  title: string;
  message: string;
  leadId: string;
  createdAt: string;
}

export const buildLeadCreatedNotification = (leadId: string, companyName: string): LeadNotification => ({
  title: 'New lead created',
  message: `Lead created for ${companyName}.`,
  leadId,
  createdAt: new Date().toISOString()
});

export const buildLeadStageChangedNotification = (
  leadId: string,
  companyName: string,
  fromStage: LeadStage,
  toStage: LeadStage
): LeadNotification => ({
  title: 'Lead stage updated',
  message: `${companyName} moved from ${fromStage.replace('_', ' ')} to ${toStage.replace('_', ' ')}.`,
  leadId,
  createdAt: new Date().toISOString()
});