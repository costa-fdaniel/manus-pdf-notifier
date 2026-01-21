import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Download, Search, Filter, Eye } from "lucide-react";
import { toast } from "sonner";

type FilterStatus = "all" | "extracted" | "enriched" | "failed";

export default function ExtractedData() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [selectedCompanies, setSelectedCompanies] = useState<number[]>([]);

  const companiesQuery = trpc.pdf.getExtractedCompanies.useQuery({
    status: filterStatus === "all" ? undefined : filterStatus,
  });

  const exportMutation = trpc.pdf.exportCompanies.useMutation();

  const filteredCompanies = companiesQuery.data?.filter((company: any) =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.cnpj.includes(searchTerm)
  ) || [];

  const handleSelectAll = () => {
    if (selectedCompanies.length === filteredCompanies.length) {
      setSelectedCompanies([]);
    } else {
      setSelectedCompanies(filteredCompanies.map((c: any) => c.id));
    }
  };

  const handleToggleCompany = (id: number) => {
    setSelectedCompanies((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const handleExportCSV = async () => {
    try {
      const result = await exportMutation.mutateAsync({
        companyIds: selectedCompanies.length > 0 ? selectedCompanies : undefined,
        format: "csv",
      });

      if (result.success && result.url) {
        const a = document.createElement("a");
        a.href = result.url;
        a.download = `empresas-${new Date().toISOString().split("T")[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        toast.success("Arquivo exportado com sucesso!");
      } else {
        toast.error("Erro ao exportar arquivo");
      }
    } catch (error: any) {
      toast.error(`Erro: ${error.message}`);
    }
  };

  const handleExportJSON = async () => {
    try {
      const result = await exportMutation.mutateAsync({
        companyIds: selectedCompanies.length > 0 ? selectedCompanies : undefined,
        format: "json",
      });

      if (result.success && result.url) {
        const a = document.createElement("a");
        a.href = result.url;
        a.download = `empresas-${new Date().toISOString().split("T")[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        toast.success("Arquivo exportado com sucesso!");
      } else {
        toast.error("Erro ao exportar arquivo");
      }
    } catch (error: any) {
      toast.error(`Erro: ${error.message}`);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { bg: string; text: string }> = {
      extracted: { bg: "bg-blue-900", text: "text-blue-200" },
      enriched: { bg: "bg-green-900", text: "text-green-200" },
      failed: { bg: "bg-red-900", text: "text-red-200" },
    };
    const style = statusMap[status] || statusMap.extracted;
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${style.bg} ${style.text}`}>
        {status === "extracted" && "Extraído"}
        {status === "enriched" && "Enriquecido"}
        {status === "failed" && "Falhou"}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Dados Extraídos</h1>
          <p className="text-slate-400">
            Visualize, filtre e exporte os dados das empresas extraídas
          </p>
        </div>

        {/* Filters and Actions */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Filtros e Ações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  <Search className="w-4 h-4 inline mr-2" />
                  Buscar
                </label>
                <Input
                  placeholder="Nome ou CNPJ..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  <Filter className="w-4 h-4 inline mr-2" />
                  Status
                </label>
                <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="extracted">Extraído</SelectItem>
                    <SelectItem value="enriched">Enriquecido</SelectItem>
                    <SelectItem value="failed">Falhou</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end gap-2">
                <Button
                  onClick={handleExportCSV}
                  disabled={exportMutation.isPending || filteredCompanies.length === 0}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Download className="w-4 h-4 mr-2" />
                  CSV
                </Button>
                <Button
                  onClick={handleExportJSON}
                  disabled={exportMutation.isPending || filteredCompanies.length === 0}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <Download className="w-4 h-4 mr-2" />
                  JSON
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Table */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white">
                  Empresas ({filteredCompanies.length})
                </CardTitle>
                <CardDescription className="text-slate-400">
                  {selectedCompanies.length > 0 && `${selectedCompanies.length} selecionadas`}
                </CardDescription>
              </div>
              {filteredCompanies.length > 0 && (
                <Button
                  onClick={handleSelectAll}
                  variant="outline"
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  {selectedCompanies.length === filteredCompanies.length
                    ? "Desselecionar Tudo"
                    : "Selecionar Tudo"}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {companiesQuery.isLoading ? (
              <div className="text-center py-8 text-slate-400">Carregando dados...</div>
            ) : filteredCompanies.length === 0 ? (
              <div className="text-center py-8 text-slate-400">Nenhuma empresa encontrada</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700 hover:bg-slate-700/50">
                      <TableHead className="text-slate-300 w-12">
                        <input
                          type="checkbox"
                          checked={
                            filteredCompanies.length > 0 &&
                            selectedCompanies.length === filteredCompanies.length
                          }
                          onChange={handleSelectAll}
                          className="rounded"
                        />
                      </TableHead>
                      <TableHead className="text-slate-300">Nome</TableHead>
                      <TableHead className="text-slate-300">CNPJ</TableHead>
                      <TableHead className="text-slate-300">E-mail</TableHead>
                      <TableHead className="text-slate-300">Telefone</TableHead>
                      <TableHead className="text-slate-300">Status</TableHead>
                      <TableHead className="text-slate-300">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCompanies.map((company: any) => (
                      <TableRow key={company.id} className="border-slate-700 hover:bg-slate-700/50">
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedCompanies.includes(company.id)}
                            onChange={() => handleToggleCompany(company.id)}
                            className="rounded"
                          />
                        </TableCell>
                        <TableCell className="text-white font-medium">{company.name}</TableCell>
                        <TableCell className="text-slate-300">{company.cnpj}</TableCell>
                        <TableCell className="text-slate-300">
                          {company.email || "-"}
                        </TableCell>
                        <TableCell className="text-slate-300">
                          {company.phone || "-"}
                        </TableCell>
                        <TableCell>{getStatusBadge(company.status)}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-blue-400 hover:text-blue-300 hover:bg-slate-700"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
