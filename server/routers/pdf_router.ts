import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { storagePut, storageGet } from "../storage";
import {
  createPdfUpload,
  getPdfUploadById,
  getCompaniesByUploadId,
  getDb,
} from "../db";
import { processPdfUpload } from "../pdf_processing_service";
import { extractedCompanies, pdfUploads } from "../../drizzle/schema";
import { eq, inArray } from "drizzle-orm";
import * as fs from "fs";
import * as path from "path";

export const pdfRouter = router({
  uploadPdf: protectedProcedure
    .input(
      z.object({
        fileName: z.string(),
        fileBuffer: z.union([
          z.instanceof(Buffer),
          z.instanceof(Uint8Array),
        ]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const fileKey = `pdfs/${ctx.user.id}/${Date.now()}-${input.fileName}`;

        const buffer = Buffer.isBuffer(input.fileBuffer)
          ? input.fileBuffer
          : Buffer.from(input.fileBuffer);

        const { url } = await storagePut(
          fileKey,
          buffer,
          "application/pdf"
        );

        const result = await createPdfUpload({
          userId: ctx.user.id,
          fileName: input.fileName,
          fileKey,
          fileUrl: url,
          status: "pending",
        });

        return {
          success: true,
          uploadId: result?.id || 0,
          fileUrl: url,
        };
      } catch (error: any) {
        return {
          success: false,
          error: `Erro ao fazer upload: ${error.message}`,
        };
      }
    }),

  processPdf: protectedProcedure
    .input(
      z.object({
        uploadId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const upload = await getPdfUploadById(input.uploadId);

        if (!upload) {
          return {
            success: false,
            error: "Upload nao encontrado",
          };
        }

        if (upload.userId !== ctx.user.id) {
          return {
            success: false,
            error: "Acesso negado",
          };
        }

        const tempDir = path.join("/tmp", `pdf-${input.uploadId}`);
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }

        const tempPdfPath = path.join(tempDir, upload.fileName);

        const result = await processPdfUpload(
          input.uploadId,
          tempPdfPath,
          ctx.user.id
        );

        try {
          fs.rmSync(tempDir, { recursive: true });
        } catch (e) {
          // Ignorar erro ao deletar
        }

        return result;
      } catch (error: any) {
        return {
          success: false,
          totalExtracted: 0,
          totalEnriched: 0,
          errors: [`Erro ao processar PDF: ${error.message}`],
        };
      }
    }),

  getUpload: protectedProcedure
    .input(z.object({ uploadId: z.number() }))
    .query(async ({ ctx, input }) => {
      const upload = await getPdfUploadById(input.uploadId);

      if (!upload) {
        return null;
      }

      if (upload.userId !== ctx.user.id) {
        return null;
      }

      return upload;
    }),

  getCompanies: protectedProcedure
    .input(z.object({ uploadId: z.number() }))
    .query(async ({ ctx, input }) => {
      const upload = await getPdfUploadById(input.uploadId);

      if (!upload || upload.userId !== ctx.user.id) {
        return [];
      }

      return await getCompaniesByUploadId(input.uploadId);
    }),

  getExtractedCompanies: protectedProcedure
    .input(
      z.object({
        status: z.enum(["extracted", "enriched", "failed"]).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];

      const companies = await db
        .select({
          id: extractedCompanies.id,
          name: extractedCompanies.companyName,
          cnpj: extractedCompanies.cnpj,
          email: extractedCompanies.email,
          phone: extractedCompanies.phone,
          status: extractedCompanies.status,
          createdAt: extractedCompanies.createdAt,
        })
        .from(extractedCompanies)
        .innerJoin(pdfUploads, eq(extractedCompanies.uploadId, pdfUploads.id))
        .where(eq(pdfUploads.userId, ctx.user.id));

      if (input.status) {
        return companies.filter((c) => c.status === input.status);
      }

      return companies;
    }),

  exportCompanies: protectedProcedure
    .input(
      z.object({
        companyIds: z.array(z.number()).optional(),
        format: z.enum(["csv", "json"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) {
          return {
            success: false,
            error: "Banco de dados nao disponivel",
          };
        }

        let companies = await db
          .select()
          .from(extractedCompanies)
          .innerJoin(pdfUploads, eq(extractedCompanies.uploadId, pdfUploads.id))
          .where(eq(pdfUploads.userId, ctx.user.id));

        if (input.companyIds && input.companyIds.length > 0) {
          companies = companies.filter((c) =>
            input.companyIds!.includes(c.extracted_companies.id)
          );
        }

        let fileContent: string;
        let mimeType: string;

        if (input.format === "csv") {
          const headers = [
            "ID",
            "Nome",
            "CNPJ",
            "E-mail",
            "Telefone",
            "Status",
            "Data",
          ];
          const rows = companies.map((row) => {
            const c = row.extracted_companies;
            return [
              c.id,
              c.companyName,
              c.cnpj,
              c.email || "",
              c.phone || "",
              c.status,
              new Date(c.createdAt).toISOString(),
            ];
          });

          fileContent =
            headers.join(",") +
            "\n" +
            rows.map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
          mimeType = "text/csv";
        } else {
          const data = companies.map((row) => row.extracted_companies);
          fileContent = JSON.stringify(data, null, 2);
          mimeType = "application/json";
        }

        const fileKey = `exports/${ctx.user.id}/${Date.now()}-companies.${input.format}`;
        const { url } = await storagePut(fileKey, fileContent, mimeType);

        return {
          success: true,
          url,
        };
      } catch (error: any) {
        return {
          success: false,
          error: `Erro ao exportar: ${error.message}`,
        };
      }
    }),
});
