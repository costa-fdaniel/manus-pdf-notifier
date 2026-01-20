import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, Upload, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function PdfUpload() {
  const { user } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const uploadMutation = trpc.pdf.uploadPdf.useMutation();
  const processMutation = trpc.pdf.processPdf.useMutation();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== "application/pdf") {
        toast.error("Por favor, selecione um arquivo PDF");
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Selecione um arquivo PDF primeiro");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const buffer = await selectedFile.arrayBuffer();
      const result = await uploadMutation.mutateAsync({
        fileName: selectedFile.name,
        fileBuffer: Buffer.from(buffer),
      });

      if (!result.success) {
        toast.error(result.error || "Erro ao fazer upload");
        return;
      }

      setUploadProgress(50);
      toast.success("PDF enviado com sucesso!");

      // Processar PDF
      const processResult = await processMutation.mutateAsync({
        uploadId: result.uploadId,
      });

      setUploadProgress(100);

      if (processResult.success) {
        const extracted = (processResult as any).totalExtracted || 0;
        const enriched = (processResult as any).totalEnriched || 0;
        toast.success(
          `${extracted} empresas extraídas, ${enriched} enriquecidas`
        );
        setSelectedFile(null);
      } else {
        const errorMsg = (processResult as any).error || "Erro ao processar PDF";
        toast.error(errorMsg);
      }
    } catch (error: any) {
      toast.error(`Erro: ${error.message}`);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Notificador de Empresas
          </h1>
          <p className="text-slate-400">
            Processe PDFs com dados de empresas e envie notificações via e-mail
          </p>
        </div>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Upload de PDF</CardTitle>
            <CardDescription className="text-slate-400">
              Selecione um PDF contendo tabelas com dados de empresas (Nome e CNPJ)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center hover:border-slate-500 transition">
              <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <label className="cursor-pointer">
                <span className="text-white font-medium">
                  Clique para selecionar ou arraste um arquivo
                </span>
                <Input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
              {selectedFile && (
                <p className="text-sm text-slate-400 mt-2">{selectedFile.name}</p>
              )}
            </div>

            {uploadProgress > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Progresso</span>
                  <span className="text-white font-medium">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            <Button
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Enviar e Processar
                </>
              )}
            </Button>

            <div className="bg-slate-700 rounded-lg p-4 space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-white font-medium">Extração automática</p>
                  <p className="text-sm text-slate-400">
                    Dados de empresas são extraídos automaticamente do PDF
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-white font-medium">Enriquecimento de dados</p>
                  <p className="text-sm text-slate-400">
                    Informações adicionais são consultadas via API de CNPJ
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-white font-medium">Pronto para envio</p>
                  <p className="text-sm text-slate-400">
                    Crie campanhas e envie e-mails personalizados
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
