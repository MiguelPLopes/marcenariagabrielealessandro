import { useState } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { StockItem } from "@/types/marcenaria";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, AlertTriangle, Package, Minus } from "lucide-react";

export default function Estoque() {
  const [stock, setStock] = useLocalStorage<StockItem[]>("stock", []);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", quantity: "", unit: "unidades", minStock: "5", pricePerUnit: "" });

  const handleSubmit = () => {
    if (!form.name || !form.quantity) return;
    const item: StockItem = {
      id: crypto.randomUUID(),
      name: form.name,
      quantity: parseFloat(form.quantity),
      unit: form.unit,
      minStock: parseFloat(form.minStock) || 5,
      pricePerUnit: parseFloat(form.pricePerUnit) || 0,
    };
    setStock((prev) => [...prev, item]);
    setForm({ name: "", quantity: "", unit: "unidades", minStock: "5", pricePerUnit: "" });
    setOpen(false);
  };

  const adjustQty = (id: string, delta: number) => {
    setStock((prev) => prev.map((s) => (s.id === id ? { ...s, quantity: Math.max(0, s.quantity + delta) } : s)));
  };

  const deleteItem = (id: string) => {
    setStock((prev) => prev.filter((s) => s.id !== id));
  };

  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const lowStockItems = stock.filter((s) => s.quantity <= s.minStock);

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="page-header flex items-center gap-2"><Package className="h-7 w-7" /> Estoque</h1>
            <p className="page-subtitle">Controle de materiais e insumos</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="h-4 w-4" /> Novo Item</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Novo Item de Estoque</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div><Label>Nome do Material</Label><Input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Chapa MDF 15mm" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Quantidade</Label><Input type="number" value={form.quantity} onChange={(e) => setForm(f => ({ ...f, quantity: e.target.value }))} /></div>
                  <div><Label>Unidade</Label><Input value={form.unit} onChange={(e) => setForm(f => ({ ...f, unit: e.target.value }))} placeholder="chapas, kg, metros" /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Estoque Mínimo</Label><Input type="number" value={form.minStock} onChange={(e) => setForm(f => ({ ...f, minStock: e.target.value }))} /></div>
                  <div><Label>Preço Unitário (R$)</Label><Input type="number" value={form.pricePerUnit} onChange={(e) => setForm(f => ({ ...f, pricePerUnit: e.target.value }))} /></div>
                </div>
                <Button onClick={handleSubmit} className="w-full">Adicionar</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Low stock alert */}
        {lowStockItems.length > 0 && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl flex gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-sm">Estoque baixo!</p>
              <p className="text-sm text-muted-foreground">
                {lowStockItems.map((s) => s.name).join(", ")} — abaixo do mínimo.
              </p>
            </div>
          </div>
        )}

        {/* Stock list */}
        {stock.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {stock.map((s) => {
              const isLow = s.quantity <= s.minStock;
              return (
                <div key={s.id} className={`stat-card ${isLow ? "border-destructive/30" : ""}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-sm">{s.name}</h3>
                      {s.pricePerUnit > 0 && <p className="text-xs text-muted-foreground">{fmt(s.pricePerUnit)}/{s.unit}</p>}
                    </div>
                    {isLow && <AlertTriangle className="h-4 w-4 text-destructive" />}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => adjustQty(s.id, -1)}>
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className={`text-lg font-bold min-w-[3ch] text-center ${isLow ? "text-destructive" : ""}`}>{s.quantity}</span>
                      <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => adjustQty(s.id, 1)}>
                        <Plus className="h-3 w-3" />
                      </Button>
                      <span className="text-xs text-muted-foreground">{s.unit}</span>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteItem(s.id)}>
                      <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">Mín: {s.minStock} {s.unit}</p>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="stat-card text-center py-12">
            <p className="text-muted-foreground">Nenhum item no estoque. Clique em "Novo Item" para começar.</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
