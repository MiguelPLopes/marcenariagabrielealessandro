import { useState } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { Transaction, EXPENSE_CATEGORIES } from "@/types/marcenaria";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, ArrowUpRight, ArrowDownRight, Trash2 } from "lucide-react";

export default function Financeiro() {
  const [transactions, setTransactions] = useLocalStorage<Transaction[]>("transactions", []);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    type: "entrada" as "entrada" | "saida",
    description: "",
    amount: "",
    category: "",
    date: new Date().toISOString().split("T")[0],
  });

  const handleSubmit = () => {
    if (!form.description || !form.amount) return;
    const newTransaction: Transaction = {
      id: crypto.randomUUID(),
      type: form.type,
      description: form.description,
      amount: parseFloat(form.amount),
      category: form.category,
      date: form.date,
    };
    setTransactions((prev) => [...prev, newTransaction]);
    setForm({ type: "entrada", description: "", amount: "", category: "", date: new Date().toISOString().split("T")[0] });
    setOpen(false);
  };

  const handleDelete = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  const totalEntradas = transactions.filter((t) => t.type === "entrada").reduce((s, t) => s + t.amount, 0);
  const totalSaidas = transactions.filter((t) => t.type === "saida").reduce((s, t) => s + t.amount, 0);
  const saldo = totalEntradas - totalSaidas;

  const formatCurrency = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const sorted = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="page-header">Financeiro</h1>
            <p className="page-subtitle">Controle de entradas e saídas</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" /> Nova Transação
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova Transação</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="flex gap-2">
                  <Button
                    variant={form.type === "entrada" ? "default" : "outline"}
                    className="flex-1"
                    onClick={() => setForm((f) => ({ ...f, type: "entrada" }))}
                  >
                    <ArrowUpRight className="h-4 w-4 mr-1" /> Entrada
                  </Button>
                  <Button
                    variant={form.type === "saida" ? "default" : "outline"}
                    className="flex-1"
                    onClick={() => setForm((f) => ({ ...f, type: "saida" }))}
                  >
                    <ArrowDownRight className="h-4 w-4 mr-1" /> Saída
                  </Button>
                </div>
                <div>
                  <Label>Descrição</Label>
                  <Input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Ex: Pagamento cliente João" />
                </div>
                <div>
                  <Label>Valor (R$)</Label>
                  <Input type="number" step="0.01" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} placeholder="0,00" />
                </div>
                <div>
                  <Label>Categoria</Label>
                  <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}>
                    <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pagamento de cliente">Pagamento de cliente</SelectItem>
                      {EXPENSE_CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Data</Label>
                  <Input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
                </div>
                <Button onClick={handleSubmit} className="w-full">Salvar</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="stat-card">
            <p className="text-sm text-muted-foreground">Total Entradas</p>
            <p className="text-xl font-bold text-success">{formatCurrency(totalEntradas)}</p>
          </div>
          <div className="stat-card">
            <p className="text-sm text-muted-foreground">Total Saídas</p>
            <p className="text-xl font-bold text-destructive">{formatCurrency(totalSaidas)}</p>
          </div>
          <div className="stat-card">
            <p className="text-sm text-muted-foreground">Saldo</p>
            <p className={`text-xl font-bold ${saldo >= 0 ? "text-success" : "text-destructive"}`}>{formatCurrency(saldo)}</p>
          </div>
        </div>

        {/* Transactions List */}
        <div className="stat-card">
          <h2 className="font-semibold mb-4">Histórico</h2>
          {sorted.length > 0 ? (
            <div className="space-y-2">
              {sorted.map((t) => (
                <div key={t.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${t.type === "entrada" ? "bg-success/15" : "bg-destructive/15"}`}>
                      {t.type === "entrada" ? <ArrowUpRight className="h-4 w-4 text-success" /> : <ArrowDownRight className="h-4 w-4 text-destructive" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{t.description}</p>
                      <p className="text-xs text-muted-foreground">{t.category} · {new Date(t.date).toLocaleDateString("pt-BR")}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    <span className={`text-sm font-semibold whitespace-nowrap ${t.type === "entrada" ? "text-success" : "text-destructive"}`}>
                      {t.type === "entrada" ? "+" : "-"}{formatCurrency(t.amount)}
                    </span>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(t.id)}>
                      <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhuma transação registrada. Clique em "Nova Transação" para começar.</p>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
