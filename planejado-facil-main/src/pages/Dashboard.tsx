import { useMemo } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { Transaction, Project, StockItem, PROJECT_STATUS_LABELS } from "@/types/marcenaria";
import { DollarSign, TrendingUp, FolderKanban, AlertTriangle, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { AppLayout } from "@/components/AppLayout";

export default function Dashboard() {
  const [transactions] = useLocalStorage<Transaction[]>("transactions", []);
  const [projects] = useLocalStorage<Project[]>("projects", []);
  const [stock] = useLocalStorage<StockItem[]>("stock", []);

  const stats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthTransactions = transactions.filter((t) => {
      const d = new Date(t.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const totalEntradas = monthTransactions
      .filter((t) => t.type === "entrada")
      .reduce((sum, t) => sum + t.amount, 0);
    const totalSaidas = monthTransactions
      .filter((t) => t.type === "saida")
      .reduce((sum, t) => sum + t.amount, 0);

    const allEntradas = transactions
      .filter((t) => t.type === "entrada")
      .reduce((sum, t) => sum + t.amount, 0);
    const allSaidas = transactions
      .filter((t) => t.type === "saida")
      .reduce((sum, t) => sum + t.amount, 0);

    const activeProjects = projects.filter(
      (p) => p.status === "producao" || p.status === "orcamento"
    ).length;

    const lowStock = stock.filter((s) => s.quantity <= s.minStock).length;

    return {
      saldo: allEntradas - allSaidas,
      lucroMes: totalEntradas - totalSaidas,
      entradasMes: totalEntradas,
      saidasMes: totalSaidas,
      activeProjects,
      lowStock,
    };
  }, [transactions, projects, stock]);

  const chartData = useMemo(() => {
    const months: Record<string, { name: string; entradas: number; saidas: number }> = {};
    const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

    transactions.forEach((t) => {
      const d = new Date(t.date);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (!months[key]) {
        months[key] = { name: monthNames[d.getMonth()], entradas: 0, saidas: 0 };
      }
      if (t.type === "entrada") months[key].entradas += t.amount;
      else months[key].saidas += t.amount;
    });

    return Object.values(months).slice(-6);
  }, [transactions]);

  const recentTransactions = useMemo(
    () => [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5),
    [transactions]
  );

  const activeProjectsList = useMemo(
    () => projects.filter((p) => p.status === "producao" || p.status === "orcamento").slice(0, 5),
    [projects]
  );

  const formatCurrency = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="page-header">Dashboard</h1>
          <p className="page-subtitle">Visão geral da sua marcenaria</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground font-medium">Saldo em Caixa</span>
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
            <p className="text-2xl font-bold text-foreground">{formatCurrency(stats.saldo)}</p>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground font-medium">Lucro do Mês</span>
              <TrendingUp className="h-5 w-5 text-success" />
            </div>
            <p className="text-2xl font-bold text-foreground">{formatCurrency(stats.lucroMes)}</p>
            <div className="flex gap-3 mt-2 text-xs">
              <span className="flex items-center gap-1 text-success">
                <ArrowUpRight className="h-3 w-3" />
                {formatCurrency(stats.entradasMes)}
              </span>
              <span className="flex items-center gap-1 text-destructive">
                <ArrowDownRight className="h-3 w-3" />
                {formatCurrency(stats.saidasMes)}
              </span>
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground font-medium">Projetos Ativos</span>
              <FolderKanban className="h-5 w-5 text-accent" />
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.activeProjects}</p>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground font-medium">Estoque Baixo</span>
              <AlertTriangle className={`h-5 w-5 ${stats.lowStock > 0 ? "text-destructive" : "text-muted-foreground"}`} />
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.lowStock} {stats.lowStock === 1 ? 'item' : 'itens'}</p>
          </div>
        </div>

        {/* Chart + Recent */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 stat-card">
            <h2 className="font-semibold mb-4">Entradas vs Saídas</h2>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(30 15% 88%)" />
                  <XAxis dataKey="name" fontSize={12} stroke="hsl(25 10% 50%)" />
                  <YAxis fontSize={12} stroke="hsl(25 10% 50%)" />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{
                      backgroundColor: "hsl(30 20% 99%)",
                      border: "1px solid hsl(30 15% 88%)",
                      borderRadius: "8px",
                      fontSize: "13px",
                    }}
                  />
                  <Bar dataKey="entradas" fill="hsl(145 45% 40%)" radius={[4, 4, 0, 0]} name="Entradas" />
                  <Bar dataKey="saidas" fill="hsl(0 65% 50%)" radius={[4, 4, 0, 0]} name="Saídas" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[260px] flex items-center justify-center text-muted-foreground text-sm">
                Registre transações para ver o gráfico
              </div>
            )}
          </div>

          <div className="stat-card">
            <h2 className="font-semibold mb-4">Transações Recentes</h2>
            {recentTransactions.length > 0 ? (
              <div className="space-y-3">
                {recentTransactions.map((t) => (
                  <div key={t.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{t.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(t.date).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <span className={`text-sm font-semibold whitespace-nowrap ml-2 ${t.type === "entrada" ? "text-success" : "text-destructive"}`}>
                      {t.type === "entrada" ? "+" : "-"}{formatCurrency(t.amount)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhuma transação registrada</p>
            )}
          </div>
        </div>

        {/* Active Projects */}
        {activeProjectsList.length > 0 && (
          <div className="stat-card">
            <h2 className="font-semibold mb-4">Projetos em Andamento</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {activeProjectsList.map((p) => (
                <div key={p.id} className="p-3 rounded-lg bg-muted/50 border border-border/50">
                  <p className="font-medium text-sm">{p.title}</p>
                  <p className="text-xs text-muted-foreground">{p.clientName}</p>
                  <span className="inline-block mt-2 text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                    {PROJECT_STATUS_LABELS[p.status]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
