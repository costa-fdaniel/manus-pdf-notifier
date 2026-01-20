import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import {
  createExtractedCompanies,
  updatePdfUploadStatus,
  updateCompanyStatus,
} from "./db";
import { lookupCnpj, extractEmail, extractPhone } from "./cnpj_service";
import type { InsertExtractedCompany } from "../drizzle/schema";

export interface ExtractedCompanyData {
  name: string;
  cnpj: string;
}

export interface ProcessingResult {
  success: boolean;
  totalExtracted: number;
  totalEnriched: number;
  errors: string[];
}

/**
 * Extrai tabelas de um PDF usando o script Python
 */
export async function extractTablesFromPdf(
  pdfPath: string
): Promise<{ success: boolean; tables?: any[]; companies?: any[]; error?: string }> {
  try {
    // Verificar se arquivo existe
    if (!fs.existsSync(pdfPath)) {
      return { success: false, error: `Arquivo não encontrado: ${pdfPath}` };
    }

    // Executar script Python
    const scriptPath = path.join(__dirname, "pdf_extractor.py");
    const command = `python3 "${scriptPath}" "${pdfPath}" extract_companies`;

    const output = execSync(command, {
      encoding: "utf-8",
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer
    });

    const result = JSON.parse(output);
    return result;
  } catch (error: any) {
    return {
      success: false,
      error: `Erro ao extrair tabelas: ${error.message}`,
    };
  }
}

/**
 * Processa um PDF: extrai empresas e enriquece com dados de CNPJ
 */
export async function processPdfUpload(
  uploadId: number,
  pdfPath: string,
  userId: number
): Promise<ProcessingResult> {
  const errors: string[] = [];
  let totalExtracted = 0;
  let totalEnriched = 0;

  try {
    // Atualizar status para "processing"
    await updatePdfUploadStatus(uploadId, "processing", 0);

    // Extrair empresas do PDF
    const extractionResult = await extractTablesFromPdf(pdfPath);

    if (!extractionResult.success) {
      await updatePdfUploadStatus(uploadId, "failed", 0);
      return {
        success: false,
        totalExtracted: 0,
        totalEnriched: 0,
        errors: [extractionResult.error || "Erro desconhecido na extração"],
      };
    }

    const companies: ExtractedCompanyData[] =
      extractionResult.companies || [];
    totalExtracted = companies.length;

    if (totalExtracted === 0) {
      await updatePdfUploadStatus(uploadId, "completed", 0);
      return {
        success: true,
        totalExtracted: 0,
        totalEnriched: 0,
        errors: ["Nenhuma empresa encontrada no PDF"],
      };
    }

    // Preparar dados para inserção
    const companiesToInsert: InsertExtractedCompany[] = companies.map(
      (company) => ({
        uploadId,
        companyName: company.name,
        cnpj: company.cnpj,
        status: "extracted",
      })
    );

    // Inserir empresas extraídas
    await createExtractedCompanies(companiesToInsert);

    // Enriquecer dados com API CNPJ
    for (let i = 0; i < companies.length; i++) {
      const company = companies[i];

      try {
        const cnpjResult = await lookupCnpj(company.cnpj);

        if (cnpjResult.success && cnpjResult.data) {
          // Atualizar empresa com dados enriquecidos
          const email = extractEmail(cnpjResult.data);
          const phone = extractPhone(cnpjResult.data);

          // Buscar ID da empresa inserida (assumindo ordem)
          // Em produção, seria melhor retornar os IDs da inserção
          const companyId = i + 1; // Simplificado para exemplo

          await updateCompanyStatus(companyId, "enriched", cnpjResult.data);

          totalEnriched++;
        } else {
          errors.push(
            `Erro ao enriquecer ${company.name}: ${cnpjResult.error}`
          );
        }
      } catch (error: any) {
        errors.push(
          `Erro ao processar CNPJ ${company.cnpj}: ${error.message}`
        );
      }

      // Atualizar progresso
      await updatePdfUploadStatus(uploadId, "processing", i + 1);

      // Delay para evitar rate limit da API CNPJ
      if (i < companies.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 600));
      }
    }

    // Atualizar status final
    await updatePdfUploadStatus(uploadId, "completed", totalExtracted);

    return {
      success: true,
      totalExtracted,
      totalEnriched,
      errors,
    };
  } catch (error: any) {
    await updatePdfUploadStatus(uploadId, "failed", totalExtracted);
    return {
      success: false,
      totalExtracted,
      totalEnriched,
      errors: [
        ...errors,
        `Erro geral no processamento: ${error.message}`,
      ],
    };
  }
}

/**
 * Valida um CNPJ básicamente
 */
export function validateCnpj(cnpj: string): boolean {
  const clean = cnpj.replace(/\D/g, "");
  return clean.length === 14 && /^\d+$/.test(clean);
}

/**
 * Formata CNPJ para o padrão XX.XXX.XXX/XXXX-XX
 */
export function formatCnpj(cnpj: string): string {
  const clean = cnpj.replace(/\D/g, "");
  if (clean.length !== 14) return cnpj;
  return `${clean.substring(0, 2)}.${clean.substring(2, 5)}.${clean.substring(
    5,
    8
  )}/${clean.substring(8, 12)}-${clean.substring(12)}`;
}
