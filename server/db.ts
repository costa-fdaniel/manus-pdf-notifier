import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, pdfUploads, InsertPdfUpload, extractedCompanies, InsertExtractedCompany, emailTemplates, InsertEmailTemplate, emailCampaigns, InsertEmailCampaign, emailLogs, InsertEmailLog } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// PDF Upload helpers
export async function createPdfUpload(data: InsertPdfUpload) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(pdfUploads).values(data);
  return result;
}

export async function getPdfUploadById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select().from(pdfUploads).where(eq(pdfUploads.id, id)).limit(1);
  return result[0];
}

export async function updatePdfUploadStatus(id: number, status: string, processedRows?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const updates: any = { status, updatedAt: new Date() };
  if (processedRows !== undefined) updates.processedRows = processedRows;
  
  await db.update(pdfUploads).set(updates).where(eq(pdfUploads.id, id));
}

// Extracted Companies helpers
export async function createExtractedCompanies(data: InsertExtractedCompany[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(extractedCompanies).values(data);
  return result;
}

export async function getCompaniesByUploadId(uploadId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select().from(extractedCompanies).where(eq(extractedCompanies.uploadId, uploadId));
  return result;
}

export async function updateCompanyStatus(id: number, status: string, cnpjData?: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const updates: any = { status, updatedAt: new Date() };
  if (cnpjData) updates.cnpjData = JSON.stringify(cnpjData);
  
  await db.update(extractedCompanies).set(updates).where(eq(extractedCompanies.id, id));
}

// Email Templates helpers
export async function createEmailTemplate(data: InsertEmailTemplate) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(emailTemplates).values(data);
  return result;
}

export async function getEmailTemplatesByUserId(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select().from(emailTemplates).where(eq(emailTemplates.userId, userId));
  return result;
}

// Email Campaigns helpers
export async function createEmailCampaign(data: InsertEmailCampaign) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(emailCampaigns).values(data);
  return result;
}

export async function getEmailCampaignById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select().from(emailCampaigns).where(eq(emailCampaigns.id, id)).limit(1);
  return result[0];
}

export async function updateEmailCampaignStatus(id: number, status: string, sentCount?: number, failedCount?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const updates: any = { status, updatedAt: new Date() };
  if (sentCount !== undefined) updates.sentCount = sentCount;
  if (failedCount !== undefined) updates.failedCount = failedCount;
  if (status === "sent") updates.sentAt = new Date();
  
  await db.update(emailCampaigns).set(updates).where(eq(emailCampaigns.id, id));
}

// Email Logs helpers
export async function createEmailLog(data: InsertEmailLog) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(emailLogs).values(data);
  return result;
}

export async function updateEmailLogStatus(id: number, status: string, messageId?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const updates: any = { status, updatedAt: new Date() };
  if (messageId) updates.messageId = messageId;
  if (status === "sent") updates.sentAt = new Date();
  
  await db.update(emailLogs).set(updates).where(eq(emailLogs.id, id));
}

export async function getEmailLogsByCampaignId(campaignId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select().from(emailLogs).where(eq(emailLogs.campaignId, campaignId));
  return result;
}
