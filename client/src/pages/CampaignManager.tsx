import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send, Mail, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface CampaignFormData {
  uploadId: number;
  templateId: number;
  name: string;
  subject: string;
  htmlBody: string;
}

export default function CampaignManager() {
  const { user } = useAuth();
  const [formData, setFormData] = useState<CampaignFormData>({
    uploadId: 0,
    templateId: 0,
    name: "",
    subject: "",
    htmlBody: "",
  });
  const [isSending, setIsSending] = useState(false);
  const [outlookConfig, setOutlookConfig] = useState({
    clientId: "",
    clientSecret: "",
    tenantId: "",
    userEmail: "",
  });

  const createTemplateMutation = trpc.campaign.createTemplate.useMutation();
  const createCampaignMutation = trpc.campaign.createCampaign.useMutation();
  const sendCampaignMutation = trpc.campaign.sendCampaign.useMutation();
  const templatesQuery = trpc.campaign.getTemplates.useQuery();

  const handleCreateTemplate = async () => {
    if (!formData.subject || !formData.htmlBody) {
      toast.error("Preencha assunto e corpo do e-mail");
      return;
    }

    try {
      const result = await createTemplateMutation.mutateAsync({
        name: formData.name || "Template sem nome",
        subject: formData.subject,
        htmlBody: formData.htmlBody,
      });

      if (result.success) {
        toast.success("Template criado com sucesso!");
        setFormData({
          ...formData,
          subject: "",
          htmlBody: "",
          name: "",
        });
        templatesQuery.refetch();
      } else {
        toast.error("Erro ao criar template");
      }
    } catch (error: any) {
      toast.error(`Erro: ${error.message}`);
    }
  };

  const handleSendCampaign = async () => {
    if (!outlookConfig.clientId || !outlookConfig.clientSecret) {
      toast.error("Configure suas credenciais do Outlook");
      return;
    }

    setIsSending(true);

    try {
      const result = await sendCampaignMutation.mutateAsync({
        campaignId: formData.templateId,
        outlookConfig,
      });

      if (result.success) {
        toast.success(
          `Campanha enviada! ${result.sentCount} enviados, ${result.failedCount} falharam`
        );
      } else {
        toast.error(result.error || "Erro ao enviar campanha");
      }
    } catch (error: any) {
      toast.error(`Erro: ${error.message}`);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">
            Gerenciador de Campanhas
          </h1>
          <p className="text-slate-400">
            Crie templates de e-mail e envie campanhas para as empresas
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Template Editor */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Criar Template</CardTitle>
              <CardDescription className="text-slate-400">
                Personalize o conteúdo do e-mail
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Nome do Template
                </label>
                <Input
                  placeholder="Ex: Lei do Bem 2025"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Assunto do E-mail
                </label>
                <Input
                  placeholder="Ex: Lei do Bem - Notificação Importante"
                  value={formData.subject}
                  onChange={(e) =>
                    setFormData({ ...formData, subject: e.target.value })
                  }
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Corpo do E-mail (HTML)
                </label>
                <Textarea
                  placeholder="Use [nome da empresa] para personalizar..."
                  value={formData.htmlBody}
                  onChange={(e) =>
                    setFormData({ ...formData, htmlBody: e.target.value })
                  }
                  className="bg-slate-700 border-slate-600 text-white h-40"
                />
              </div>

              <Button
                onClick={handleCreateTemplate}
                disabled={createTemplateMutation.isPending}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {createTemplateMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Salvar Template
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Outlook Configuration */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Configurar Outlook</CardTitle>
              <CardDescription className="text-slate-400">
                Credenciais para envio de e-mails
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Client ID
                </label>
                <Input
                  type="password"
                  placeholder="Seu Client ID do Azure"
                  value={outlookConfig.clientId}
                  onChange={(e) =>
                    setOutlookConfig({
                      ...outlookConfig,
                      clientId: e.target.value,
                    })
                  }
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Client Secret
                </label>
                <Input
                  type="password"
                  placeholder="Seu Client Secret do Azure"
                  value={outlookConfig.clientSecret}
                  onChange={(e) =>
                    setOutlookConfig({
                      ...outlookConfig,
                      clientSecret: e.target.value,
                    })
                  }
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Tenant ID
                </label>
                <Input
                  placeholder="Seu Tenant ID do Azure"
                  value={outlookConfig.tenantId}
                  onChange={(e) =>
                    setOutlookConfig({
                      ...outlookConfig,
                      tenantId: e.target.value,
                    })
                  }
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  E-mail do Remetente
                </label>
                <Input
                  type="email"
                  placeholder="seu.email@outlook.com"
                  value={outlookConfig.userEmail}
                  onChange={(e) =>
                    setOutlookConfig({
                      ...outlookConfig,
                      userEmail: e.target.value,
                    })
                  }
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>

              <Button
                onClick={handleSendCampaign}
                disabled={isSending}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                {isSending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Enviar Campanha
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Templates List */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Templates Salvos</CardTitle>
          </CardHeader>
          <CardContent>
            {templatesQuery.data && templatesQuery.data.length > 0 ? (
              <div className="space-y-3">
                {templatesQuery.data.map((template) => (
                  <div
                    key={template.id}
                    className="bg-slate-700 rounded-lg p-4 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-white font-medium">{template.name}</p>
                      <p className="text-sm text-slate-400">{template.subject}</p>
                    </div>
                    {template.isDefault && (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400">Nenhum template criado ainda</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
