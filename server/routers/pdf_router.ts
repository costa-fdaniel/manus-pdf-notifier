import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { storagePut, storageGet } from "../storage";
import {
  createPdfUpload,
  getPdfUploadById,
  getCompaniesByUploadId,
} from "../db";
import { processPdfUpload } from "../pdf_processing_service";
import * as fs from "fs";
import * as path from "path";

export const pdfRouter = router({
  uploadPdf: protectedProcedure
    .input(
      z.object({
        fileName: z.string(),
        fileBuffer: z.instanceof(Buffer),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const fileKey = `pdfs/${ctx.user.id}/${Date.now()}-${input.fileName}`;

        const { url } = await storagePut(
          fileKey,
          input.fileBuffer,
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
          uploadId: (result as any).insertId,
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
            error: "Upload não encontrado",
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
});
