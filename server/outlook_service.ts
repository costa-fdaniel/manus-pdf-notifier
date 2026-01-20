import axios from "axios";

export interface OutlookEmailConfig {
  clientId: string;
  clientSecret: string;
  tenantId: string;
  userEmail: string;
}

export interface EmailMessage {
  to: string;
  subject: string;
  htmlBody: string;
  ccRecipients?: string[];
  bccRecipients?: string[];
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

let accessToken: string = "";
let tokenExpiry: number = 0;

/**
 * Obtém token de acesso do Azure AD
 */
async function getAccessToken(config: OutlookEmailConfig): Promise<string> {
  // Verificar se token ainda é válido
  if (accessToken && tokenExpiry > Date.now()) {
    return accessToken;
  }

  try {
    const tokenUrl = `https://login.microsoftonline.com/${config.tenantId}/oauth2/v2.0/token`;

    const response = await axios.post(
      tokenUrl,
      new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        scope: "https://graph.microsoft.com/.default",
        grant_type: "client_credentials",
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    accessToken = response.data.access_token;
    tokenExpiry = Date.now() + (response.data.expires_in - 60) * 1000; // Renovar 1 min antes

    return accessToken || "";
  } catch (error: any) {
    throw new Error(
      `Erro ao obter token Azure AD: ${error.response?.data?.error_description || error.message}`
    );
  }
}

/**
 * Envia um e-mail via Microsoft Graph API
 */
export async function sendEmail(
  config: OutlookEmailConfig,
  message: EmailMessage
): Promise<SendEmailResult> {
  try {
    const token = await getAccessToken(config);

    const emailBody = {
      message: {
        subject: message.subject,
        body: {
          contentType: "HTML",
          content: message.htmlBody,
        },
        toRecipients: [
          {
            emailAddress: {
              address: message.to,
            },
          },
        ],
        ccRecipients: (message.ccRecipients || []).map((email) => ({
          emailAddress: {
            address: email,
          },
        })),
        bccRecipients: (message.bccRecipients || []).map((email) => ({
          emailAddress: {
            address: email,
          },
        })),
      },
      saveToSentItems: true,
    };

    const response = await axios.post(
      `https://graph.microsoft.com/v1.0/users/${config.userEmail}/sendMail`,
      emailBody,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    return {
      success: true,
      messageId: response.headers["x-ms-request-id"],
    };
  } catch (error: any) {
    return {
      success: false,
      error: `Erro ao enviar e-mail: ${error.response?.data?.error?.message || error.message}`,
    };
  }
}

/**
 * Envia múltiplos e-mails com delay entre eles
 */
export async function sendBulkEmails(
  config: OutlookEmailConfig,
  messages: EmailMessage[],
  delayMs: number = 1000
): Promise<SendEmailResult[]> {
  const results: SendEmailResult[] = [];

  for (let i = 0; i < messages.length; i++) {
    const result = await sendEmail(config, messages[i]);
    results.push(result);

    // Delay entre envios
    if (i < messages.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return results;
}

/**
 * Valida configuração do Outlook
 */
export function validateConfig(config: OutlookEmailConfig): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!config.clientId) errors.push("clientId é obrigatório");
  if (!config.clientSecret) errors.push("clientSecret é obrigatório");
  if (!config.tenantId) errors.push("tenantId é obrigatório");
  if (!config.userEmail) errors.push("userEmail é obrigatório");
  if (!config.userEmail.includes("@")) errors.push("userEmail deve ser um e-mail válido");

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Testa conexão com Microsoft Graph API
 */
export async function testConnection(
  config: OutlookEmailConfig
): Promise<{ success: boolean; error?: string }> {
  try {
    const validation = validateConfig(config);
    if (!validation.valid) {
      return {
        success: false,
        error: `Configuração inválida: ${validation.errors.join(", ")}`,
      };
    }

    const token = await getAccessToken(config);

    // Fazer uma requisição simples para testar
    await axios.get(`https://graph.microsoft.com/v1.0/users/${config.userEmail}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: `Erro ao testar conexão: ${error.message}`,
    };
  }
}
