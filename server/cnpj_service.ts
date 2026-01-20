import axios from "axios";

const OPENCNPJ_API_BASE = "https://api.opencnpj.org";

export interface CnpjData {
  cnpj: string;
  razao_social: string;
  nome_fantasia?: string;
  situacao_cadastral: string;
  data_situacao_cadastral: string;
  email?: string;
  telefones?: Array<{
    ddd: string;
    numero: string;
    is_fax: boolean;
  }>;
  logradouro?: string;
  numero?: string;
  bairro?: string;
  cep?: string;
  uf?: string;
  municipio?: string;
  porte_empresa?: string;
  capital_social?: string;
  [key: string]: any;
}

export interface CnpjLookupResult {
  success: boolean;
  data?: CnpjData;
  error?: string;
}

/**
 * Consulta dados de uma empresa via CNPJ usando a API OpenCNPJ
 * @param cnpj CNPJ da empresa (com ou sem formatação)
 * @returns Dados da empresa ou erro
 */
export async function lookupCnpj(cnpj: string): Promise<CnpjLookupResult> {
  try {
    // Validar e limpar CNPJ
    const cleanCnpj = cnpj.replace(/\D/g, "");

    if (cleanCnpj.length !== 14) {
      return {
        success: false,
        error: `CNPJ inválido: ${cnpj}. Deve conter 14 dígitos.`,
      };
    }

    // Fazer requisição à API OpenCNPJ
    const response = await axios.get(`${OPENCNPJ_API_BASE}/${cleanCnpj}`, {
      timeout: 10000,
      headers: {
        "User-Agent": "EmpresaPdfNotifier/1.0",
      },
    });

    return {
      success: true,
      data: response.data as CnpjData,
    };
  } catch (error: any) {
    if (error.response?.status === 404) {
      return {
        success: false,
        error: `CNPJ não encontrado: ${cnpj}`,
      };
    }

    if (error.response?.status === 429) {
      return {
        success: false,
        error: "Rate limit excedido. Tente novamente em alguns momentos.",
      };
    }

    return {
      success: false,
      error: `Erro ao consultar CNPJ: ${error.message}`,
    };
  }
}

/**
 * Consulta múltiplos CNPJs em sequência com delay para evitar rate limit
 * @param cnpjs Array de CNPJs
 * @param delayMs Delay em ms entre requisições (padrão: 500ms)
 * @returns Array com resultados
 */
export async function lookupMultipleCnpjs(
  cnpjs: string[],
  delayMs: number = 500
): Promise<CnpjLookupResult[]> {
  const results: CnpjLookupResult[] = [];

  for (const cnpj of cnpjs) {
    const result = await lookupCnpj(cnpj);
    results.push(result);

    // Delay entre requisições para evitar rate limit
    if (cnpj !== cnpjs[cnpjs.length - 1]) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return results;
}

/**
 * Extrai email de dados CNPJ
 */
export function extractEmail(cnpjData: CnpjData): string | null {
  return cnpjData.email || null;
}

/**
 * Extrai telefone de dados CNPJ
 */
export function extractPhone(cnpjData: CnpjData): string | null {
  if (cnpjData.telefones && cnpjData.telefones.length > 0) {
    const phone = cnpjData.telefones[0];
    if (!phone.is_fax) {
      return `+55 ${phone.ddd} ${phone.numero}`;
    }
  }
  return null;
}

/**
 * Formata endereço completo a partir de dados CNPJ
 */
export function formatAddress(cnpjData: CnpjData): string {
  const parts = [
    cnpjData.logradouro,
    cnpjData.numero,
    cnpjData.bairro,
    cnpjData.municipio,
    cnpjData.uf,
  ].filter(Boolean);

  return parts.join(", ");
}
