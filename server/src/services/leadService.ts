import { v4 as uuidv4 } from 'uuid';
import { executeQuery } from '../config/database.js';
import { Lead, LeadStage, PaginationMeta } from '../types/index.js';
import { CreateLeadRequest, UpdateLeadRequest } from '../validators/lead.js';

const toMySQLDateTime = (isoString: string | null): string | null => {
  if (!isoString) return null;
  return new Date(isoString).toISOString().slice(0, 19).replace('T', ' ');
};

interface QueryOptions {
  page?: number;
  limit?: number;
  stage?: string;
  source?: string;
  owner?: string;
}

export const getAllLeads = async (
  options: QueryOptions,
  userId: string,
  userRole: string
): Promise<{ leads: Lead[]; meta: PaginationMeta }> => {
  try {
    const { page = 1, limit = 10, stage, source, owner } = options;
    const offset = (page - 1) * limit;

    // Get total count first
    const countQuery = 'SELECT COUNT(*) as total FROM leads WHERE is_deleted = 0';
    const [countResult]: any = await executeQuery(countQuery, []);
    const total = countResult?.[0]?.total || 0;

    // Get paginated leads - convert to integers
    const limitNum = parseInt(String(limit), 10);
    const offsetNum = parseInt(String(offset), 10);
    
    const dataQuery = `
      SELECT id, company_name, contact_name, email, phone, stage, priority, source, 
             owner_id, created_by, is_deleted, created_at, updated_at
      FROM leads
      WHERE is_deleted = 0
      ORDER BY created_at DESC
      LIMIT ${limitNum} OFFSET ${offsetNum}
    `;
    
    const [dataResult]: any = await executeQuery(dataQuery, []);

    return {
      leads: dataResult || [],
      meta: {
        total,
        page,
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      }
    };
  } catch (error) {
    console.error('getAllLeads error:', error);
    throw error;
  }
};

export const getLeadById = async (leadId: string): Promise<Lead | null> => {
  const [rows]: any = await executeQuery(
    `SELECT 
      l.*,
      u.full_name as owner_name,
      u.email as owner_email,
      c.full_name as created_by_name,
      c.email as created_by_email
    FROM leads l
    LEFT JOIN users u ON l.owner_id = u.id
    LEFT JOIN users c ON l.created_by = c.id
    WHERE l.id = ? AND l.is_deleted = 0`,
    [leadId]
  );

  return rows?.[0] || null;
};

export const createLead = async (
  leadData: CreateLeadRequest,
  createdBy: string
): Promise<Lead> => {
  // Check if company name already exists
  const [existingLeads]: any = await executeQuery(
    `SELECT id, company_name FROM leads WHERE LOWER(TRIM(company_name)) = LOWER(TRIM(?)) AND is_deleted = 0`,
    [leadData.company_name]
  );

  if (existingLeads && existingLeads.length > 0) {
    throw new Error(`A lead with company name "${leadData.company_name}" already exists`);
  }

  const leadId = uuidv4();
  const now = toMySQLDateTime(new Date().toISOString());

  await executeQuery(
    `INSERT INTO leads (
      id, company_name, contact_name, email, phone,
      stage, priority, source, owner_id, created_by, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      leadId,
      leadData.company_name,
      leadData.contact_name,
      leadData.email,
      leadData.phone || null,
      leadData.stage,
      leadData.priority,
      leadData.source,
      leadData.owner_id || null,
      createdBy,
      now,
      now
    ]
  );

  const lead = await getLeadById(leadId);
  if (!lead) {
    throw new Error('Failed to retrieve created lead');
  }

  return lead;
};

export const updateLead = async (
  leadId: string,
  updates: UpdateLeadRequest
): Promise<Lead> => {
  const fields: string[] = [];
  const values: any[] = [];

  // If company name is being updated, check for duplicates
  if (updates.company_name !== undefined) {
    const [existingLeads]: any = await executeQuery(
      `SELECT id, company_name FROM leads 
       WHERE LOWER(TRIM(company_name)) = LOWER(TRIM(?)) 
       AND is_deleted = 0 
       AND id != ?`,
      [updates.company_name, leadId]
    );

    if (existingLeads && existingLeads.length > 0) {
      throw new Error(`A lead with company name "${updates.company_name}" already exists`);
    }

    fields.push('company_name = ?');
    values.push(updates.company_name);
  }

  if (updates.contact_name !== undefined) {
    fields.push('contact_name = ?');
    values.push(updates.contact_name);
  }

  if (updates.email !== undefined) {
    fields.push('email = ?');
    values.push(updates.email);
  }

  if (updates.phone !== undefined) {
    fields.push('phone = ?');
    values.push(updates.phone);
  }

  if (updates.stage !== undefined) {
    fields.push('stage = ?');
    values.push(updates.stage);
  }

  if (updates.priority !== undefined) {
    fields.push('priority = ?');
    values.push(updates.priority);
  }

  if (updates.source !== undefined) {
    fields.push('source = ?');
    values.push(updates.source);
  }

  if (updates.owner_id !== undefined) {
    fields.push('owner_id = ?');
    values.push(updates.owner_id);
  }

  if (fields.length === 0) {
    const lead = await getLeadById(leadId);
    if (!lead) {
      throw new Error('Lead not found');
    }
    return lead;
  }

  values.push(leadId);

  await executeQuery(
    `UPDATE leads SET ${fields.join(', ')} WHERE id = ?`,
    values
  );

  const lead = await getLeadById(leadId);
  if (!lead) {
    throw new Error('Lead not found after update');
  }

  return lead;
};

export const updateLeadStage = async (
  leadId: string,
  stage: LeadStage
): Promise<Lead> => {
  await executeQuery(
    `UPDATE leads SET stage = ? WHERE id = ?`,
    [stage, leadId]
  );

  const lead = await getLeadById(leadId);
  if (!lead) {
    throw new Error('Lead not found after stage update');
  }

  return lead;
};

export const deleteLead = async (leadId: string): Promise<void> => {
  await executeQuery(
    `UPDATE leads SET is_deleted = 1 WHERE id = ?`,
    [leadId]
  );
};

export const getLeadStats = async (
  userId: string,
  userRole: string
): Promise<any> => {
  let whereClause = 'WHERE l.is_deleted = 0';
  const params: any[] = [];

  if (userRole !== 'admin') {
    whereClause += ' AND (l.owner_id = ? OR l.created_by = ?)';
    params.push(userId, userId);
  }

  const [stageRows]: any = await executeQuery(
    `SELECT stage, COUNT(*) as count FROM leads l ${whereClause} GROUP BY stage`,
    params
  );

  const [sourceRows]: any = await executeQuery(
    `SELECT source, COUNT(*) as count FROM leads l ${whereClause} GROUP BY source`,
    params
  );

  const [priorityRows]: any = await executeQuery(
    `SELECT priority, COUNT(*) as count FROM leads l ${whereClause} GROUP BY priority`,
    params
  );

  const [totalRows]: any = await executeQuery(
    `SELECT COUNT(*) as total FROM leads l ${whereClause}`,
    params
  );

  const stageStats = {
    new: 0,
    in_discussion: 0,
    quoted: 0,
    won: 0,
    lost: 0
  };

  (stageRows || []).forEach((row: any) => {
    stageStats[row.stage as keyof typeof stageStats] = row.count;
  });

  const sourceStats = {
    web: 0,
    referral: 0,
    campaign: 0,
    manual: 0
  };

  (sourceRows || []).forEach((row: any) => {
    sourceStats[row.source as keyof typeof sourceStats] = row.count;
  });

  const priorityStats = {
    high: 0,
    medium: 0,
    low: 0
  };

  (priorityRows || []).forEach((row: any) => {
    priorityStats[row.priority as keyof typeof priorityStats] = row.count;
  });

  const totalLeads = totalRows[0]?.total || 0;
  const conversionRate = totalLeads > 0 
    ? ((stageStats.won / totalLeads) * 100).toFixed(2)
    : '0.00';

  return {
    total: totalLeads,
    byStage: stageStats,
    bySource: sourceStats,
    byPriority: priorityStats,
    conversionRate: parseFloat(conversionRate)
  };
};

export const getAssignableOwners = async (): Promise<Array<{ id: string; full_name: string; email: string }>> => {
  const [rows]: any = await executeQuery(
    'SELECT id, full_name, email FROM users WHERE is_active = 1 ORDER BY full_name'
  );

  return rows || [];
};