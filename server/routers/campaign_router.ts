import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  createEmailTemplate,
  getEmailTemplatesByUserId,
  createEmailCampaign,
  getEmailCampaignById,
  updateEmailCampaignStatus,
  createEmailLog,
  updateEmailLogStatus,
  getEmailLogsByCampaignId,
  getCompaniesByUploadId,
  getDb,
} from "../db";
import { sendEmail } from "../outlook_service";
import { eq } from "drizzle-orm";
import type { OutlookEmailConfig } from "../outlook_service";

export const campaignRouter = router({
  createTemplate: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        subject: z.string(),
        htmlBody: z.string(),
        isDefault: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const result = await createEmailTemplate({
          userId: ctx.user.id,
          name: input.name,
          subject: input.subject,
          htmlBody: input.htmlBody,
          isDefault: input.isDefault || false,
        });

        return {
          success: true,
          templateId: (result as any).insertId,
        };
      } catch (error: any) {
        return {
          success: false,
          error: `Erro ao criar template: ${error.message}`,
        };
      }
    }),

  getTemplates: protectedProcedure.query(async ({ ctx }) => {
    try {
      return await getEmailTemplatesByUserId(ctx.user.id);
    } catch (error: any) {
      return [];
    }
  }),

  createCampaign: protectedProcedure
    .input(
      z.object({
        uploadId: z.number(),
        templateId: z.number(),
        name: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const companies = await getCompaniesByUploadId(input.uploadId);

        const result = await createEmailCampaign({
          userId: ctx.user.id,
          uploadId: input.uploadId,
          templateId: input.templateId,
          name: input.name,
          totalRecipients: companies.length,
          status: "draft",
        });

        return {
          success: true,
          campaignId: (result as any).insertId,
        };
      } catch (error: any) {
        return {
          success: false,
          error: `Erro ao criar campanha: ${error.message}`,
        };
      }
    }),

  getCampaign: protectedProcedure
    .input(z.object({ campaignId: z.number() }))
    .query(async ({ ctx, input }) => {
      const campaign = await getEmailCampaignById(input.campaignId);

      if (!campaign || campaign.userId !== ctx.user.id) {
        return null;
      }

      return campaign;
    }),

  sendCampaign: protectedProcedure
    .input(
      z.object({
        campaignId: z.number(),
        outlookConfig: z.object({
          clientId: z.string(),
          clientSecret: z.string(),
          tenantId: z.string(),
          userEmail: z.string(),
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const campaign = await getEmailCampaignById(input.campaignId);

        if (!campaign || campaign.userId !== ctx.user.id) {
          return {
            success: false,
            error: "Campanha não encontrada",
          };
        }

        await updateEmailCampaignStatus(input.campaignId, "sending");

        const companies = await getCompaniesByUploadId(campaign.uploadId);
        let sentCount = 0;
        let failedCount = 0;

        for (const company of companies) {
          try {
            const cnpjData = company.cnpjData
              ? JSON.parse(company.cnpjData)
              : null;
            const email = company.email || cnpjData?.email;

            if (!email) {
              failedCount++;
              continue;
            }

            const emailBody = campaign.name
              .replace(/\[nome da empresa\]/g, company.companyName)
              .replace(/\[cnpj\]/g, company.cnpj);

            const result = await sendEmail(input.outlookConfig as OutlookEmailConfig, {
              to: email,
              subject: "Lei do Bem - Notificação de Empresa",
              htmlBody: emailBody,
            });

            if (result.success) {
              await createEmailLog({
                campaignId: input.campaignId,
                companyId: company.id,
                recipientEmail: email,
                status: "sent",
                messageId: result.messageId,
              });
              sentCount++;
            } else {
              await createEmailLog({
                campaignId: input.campaignId,
                companyId: company.id,
                recipientEmail: email,
                status: "failed",
                errorMessage: result.error,
              });
              failedCount++;
            }
          } catch (error: any) {
            failedCount++;
          }

          await new Promise((resolve) => setTimeout(resolve, 1000));
        }

        await updateEmailCampaignStatus(
          input.campaignId,
          "sent",
          sentCount,
          failedCount
        );

        return {
          success: true,
          sentCount,
          failedCount,
        };
      } catch (error: any) {
        await updateEmailCampaignStatus(input.campaignId, "failed");
        return {
          success: false,
          error: `Erro ao enviar campanha: ${error.message}`,
        };
      }
    }),

  getCampaignLogs: protectedProcedure
    .input(z.object({ campaignId: z.number() }))
    .query(async ({ ctx, input }) => {
      const campaign = await getEmailCampaignById(input.campaignId);

      if (!campaign || campaign.userId !== ctx.user.id) {
        return [];
      }

      return await getEmailLogsByCampaignId(input.campaignId);
    }),

  getStats: protectedProcedure.query(async ({ ctx }) => {
    try {
      const db = await getDb();
      if (!db) {
        return {
          totalUploads: 0,
          totalCompanies: 0,
          enrichedCompanies: 0,
          totalCampaigns: 0,
          totalEmailsSent: 0,
          totalEmailsFailed: 0,
          weeklyData: [],
          statusBreakdown: [],
        };
      }

      const { pdfUploads, extractedCompanies, emailCampaigns, emailLogs } = await import(
        "../../drizzle/schema"
      );

      const uploads = await db
        .select()
        .from(pdfUploads)
        .where(eq(pdfUploads.userId, ctx.user.id));

      const companies = await db
        .select()
        .from(extractedCompanies);

      const campaigns = await db
        .select()
        .from(emailCampaigns)
        .where(eq(emailCampaigns.userId, ctx.user.id));

      const logs = await db.select().from(emailLogs);

      const enrichedCount = companies.filter(
        (c: any) => c.status === "enriched"
      ).length;
      const sentCount = logs.filter((l: any) => l.status === "sent").length;
      const failedCount = logs.filter((l: any) => l.status === "failed").length;

      const statusBreakdown = [
        {
          name: "Extraído",
          value: companies.filter((c: any) => c.status === "extracted").length,
        },
        {
          name: "Enriquecido",
          value: enrichedCount,
        },
        {
          name: "Enviado",
          value: companies.filter((c: any) => c.status === "emailed").length,
        },
        {
          name: "Falhou",
          value: companies.filter((c: any) => c.status === "failed").length,
        },
      ];

      const weeklyData = [
        { day: "Seg", uploads: 0, emails: 0 },
        { day: "Ter", uploads: 0, emails: 0 },
        { day: "Qua", uploads: 0, emails: 0 },
        { day: "Qui", uploads: 0, emails: 0 },
        { day: "Sex", uploads: 0, emails: 0 },
        { day: "Sab", uploads: 0, emails: 0 },
        { day: "Dom", uploads: 0, emails: 0 },
      ];

      return {
        totalUploads: uploads.length,
        totalCompanies: companies.length,
        enrichedCompanies: enrichedCount,
        totalCampaigns: campaigns.length,
        totalEmailsSent: sentCount,
        totalEmailsFailed: failedCount,
        weeklyData,
        statusBreakdown,
      };
    } catch (error: any) {
      return {
        totalUploads: 0,
        totalCompanies: 0,
        enrichedCompanies: 0,
        totalCampaigns: 0,
        totalEmailsSent: 0,
        totalEmailsFailed: 0,
        weeklyData: [],
        statusBreakdown: [],
      };
    }
  }),
});
