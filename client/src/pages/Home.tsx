import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileUp, Mail, BarChart3, Zap } from "lucide-react";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";

export default function Home() {
  const { user, isAuthenticated, logout } = useAuth();
  const [, setLocation] = useLocation();

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center p-4">
        <div className="text-center max-w-2xl">
          <h1 className="text-5xl font-bold text-white mb-4">
            Notificador de Empresas
          </h1>
          <p className="text-xl text-slate-400 mb-8">
            Processe PDFs com dados de empresas, enriqueça informações via CNPJ e envie notificações por e-mail automaticamente.
          </p>
          <Button
            onClick={() => (window.location.href = getLoginUrl())}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
          >
            Começar Agora
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              Bem-vindo, {user?.name}!
            </h1>
            <p className="text-slate-400">
              Gerencie suas campanhas de notificação de empresas
            </p>
          </div>
          <Button
            onClick={() => logout()}
            variant="outline"
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            Sair
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card
            className="bg-slate-800 border-slate-700 cursor-pointer hover:border-blue-500 transition"
            onClick={() => setLocation("/upload")}
          >
            <CardHeader>
              <FileUp className="w-8 h-8 text-blue-500 mb-2" />
              <CardTitle className="text-white">Upload de PDF</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-400">
                Envie e processe PDFs com dados de empresas
              </p>
            </CardContent>
          </Card>

          <Card
            className="bg-slate-800 border-slate-700 cursor-pointer hover:border-green-500 transition"
            onClick={() => setLocation("/campaigns")}
          >
            <CardHeader>
              <Mail className="w-8 h-8 text-green-500 mb-2" />
              <CardTitle className="text-white">Campanhas</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-400">
                Crie e envie campanhas de e-mail
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700 cursor-pointer hover:border-purple-500 transition">
            <CardHeader>
              <BarChart3 className="w-8 h-8 text-purple-500 mb-2" />
              <CardTitle className="text-white">Relatórios</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-400">
                Visualize estatísticas e histórico
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700 cursor-pointer hover:border-orange-500 transition">
            <CardHeader>
              <Zap className="w-8 h-8 text-orange-500 mb-2" />
              <CardTitle className="text-white">Automação</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-400">
                Configure fluxos automáticos
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Como Funciona</CardTitle>
            <CardDescription className="text-slate-400">
              Três passos simples para notificar suas empresas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold">1</span>
                </div>
                <h3 className="text-white font-semibold mb-2">Upload</h3>
                <p className="text-sm text-slate-400">
                  Envie um PDF contendo tabelas com dados de empresas
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold">2</span>
                </div>
                <h3 className="text-white font-semibold mb-2">Enriquecimento</h3>
                <p className="text-sm text-slate-400">
                  Dados são automaticamente enriquecidos com informações de CNPJ
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold">3</span>
                </div>
                <h3 className="text-white font-semibold mb-2">Envio</h3>
                <p className="text-sm text-slate-400">
                  Crie campanhas e envie e-mails personalizados via Outlook
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
