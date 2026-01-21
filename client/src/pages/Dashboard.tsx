import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { FileUp, Mail, CheckCircle2, AlertCircle, Users } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const statsQuery = trpc.campaign.getStats.useQuery();

  const stats = statsQuery.data || {
    totalUploads: 0,
    totalCompanies: 0,
    enrichedCompanies: 0,
    totalCampaigns: 0,
    totalEmailsSent: 0,
    totalEmailsFailed: 0,
    weeklyData: [],
    statusBreakdown: [],
  };

  const StatCard = ({
    icon: Icon,
    label,
    value,
    color,
  }: {
    icon: any;
    label: string;
    value: number;
    color: string;
  }) => (
    <Card className="bg-slate-800 border-slate-700">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-400 mb-1">{label}</p>
            <p className="text-3xl font-bold text-white">{value}</p>
          </div>
          <Icon className={`w-12 h-12 ${color}`} />
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-slate-400">
            Visualize métricas e estatísticas de suas campanhas
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={FileUp}
            label="PDFs Processados"
            value={stats.totalUploads}
            color="text-blue-500"
          />
          <StatCard
            icon={Users}
            label="Empresas Extraídas"
            value={stats.totalCompanies}
            color="text-green-500"
          />
          <StatCard
            icon={CheckCircle2}
            label="Enriquecidas"
            value={stats.enrichedCompanies}
            color="text-purple-500"
          />
          <StatCard
            icon={Mail}
            label="E-mails Enviados"
            value={stats.totalEmailsSent}
            color="text-orange-500"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Weekly Activity */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Atividade Semanal</CardTitle>
              <CardDescription className="text-slate-400">
                Processamentos e envios por dia
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={stats.weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                  <XAxis stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      border: "1px solid #475569",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="uploads"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: "#3b82f6" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="emails"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ fill: "#10b981" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Status Breakdown */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Distribuição de Status</CardTitle>
              <CardDescription className="text-slate-400">
                Empresas por status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={stats.statusBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    <Cell fill="#3b82f6" />
                    <Cell fill="#10b981" />
                    <Cell fill="#f59e0b" />
                    <Cell fill="#ef4444" />
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      border: "1px solid #475569",
                      borderRadius: "8px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Campaign Summary */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Resumo de Campanhas</CardTitle>
            <CardDescription className="text-slate-400">
              Últimas campanhas criadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-700 rounded-lg">
                <div>
                  <p className="text-white font-medium">Total de Campanhas</p>
                  <p className="text-sm text-slate-400">
                    {stats.totalCampaigns} campanhas criadas
                  </p>
                </div>
                <p className="text-2xl font-bold text-blue-500">
                  {stats.totalCampaigns}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-700 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    <p className="text-slate-300">E-mails Enviados</p>
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {stats.totalEmailsSent}
                  </p>
                </div>

                <div className="p-4 bg-slate-700 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    <p className="text-slate-300">E-mails Falhados</p>
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {stats.totalEmailsFailed}
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
