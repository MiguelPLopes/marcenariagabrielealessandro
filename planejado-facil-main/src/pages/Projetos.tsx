import { useState } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { Project, ProjectStatus, ProjectMaterial, MdfSheet, LaborDurationType, PROJECT_STATUS_LABELS, PROJECT_STATUS_COLORS } from "@/types/marcenaria";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Ruler, Pencil, PackagePlus, FileDown, Search } from "lucide-react";
import { exportProjectPdf } from "@/lib/exportPdf";

interface MdfSheetItem {
  color: string;
  quantity: string;
  pricePerSheet: string;
}

interface AdditionalCostItem {
  name: string;
  quantity: string;
  unitPrice: string;
}

const INITIAL_FORM = {
  clientName: "", clientPhone: "", clientAddress: "",
  title: "", description: "",
  width: "", height: "", depth: "",
  laborDays: "5",
  laborDailyRate: "150",
  laborDurationType: "dias" as LaborDurationType,
  profitMargin: "30",
};

type FormState = typeof INITIAL_FORM;

export default function Projetos() {
  const [projects, setProjects] = useLocalStorage<Project[]>("projects", []);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [mdfSheets, setMdfSheets] = useState<MdfSheetItem[]>([]);
  const [additionalCosts, setAdditionalCosts] = useState<AdditionalCostItem[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>("todos");
  const [filterSearch, setFilterSearch] = useState("");

  const calcLaborCost = (days: number, dailyRate: number, durationType: LaborDurationType) => {
    const totalDays = durationType === "meses" ? days * 22 : days;
    return totalDays * dailyRate;
  };

  const parsedMdfSheets = (): MdfSheet[] =>
    mdfSheets.map(s => ({
      color: s.color,
      quantity: parseFloat(s.quantity) || 0,
      pricePerSheet: parseFloat(s.pricePerSheet) || 0,
      total: (parseFloat(s.quantity) || 0) * (parseFloat(s.pricePerSheet) || 0),
    }));

  const mdfSheetsTotal = () =>
    parsedMdfSheets().reduce((sum, s) => sum + s.total, 0);

  const parsedAdditionalCosts = (): ProjectMaterial[] =>
    additionalCosts.map(c => ({
      name: c.name,
      quantity: parseFloat(c.quantity) || 0,
      unitPrice: parseFloat(c.unitPrice) || 0,
      total: (parseFloat(c.quantity) || 0) * (parseFloat(c.unitPrice) || 0),
    }));

  const additionalCostsTotal = () =>
    parsedAdditionalCosts().reduce((sum, c) => sum + c.total, 0);

  const buildProject = (formData: FormState, id?: string): Project => {
    const w = parseFloat(formData.width) || 0;
    const h = parseFloat(formData.height) || 0;
    const d = parseFloat(formData.depth) || 0;
    const laborDays = parseFloat(formData.laborDays) || 0;
    const laborDailyRate = parseFloat(formData.laborDailyRate) || 0;
    const margin = parseFloat(formData.profitMargin) || 0;
    const laborCost = calcLaborCost(laborDays, laborDailyRate, formData.laborDurationType);
    const sheets = parsedMdfSheets();
    const mdfCost = sheets.reduce((s, m) => s + m.total, 0);
    const materials = parsedAdditionalCosts();
    const addCosts = materials.reduce((s, m) => s + m.total, 0);
    const totalCost = mdfCost + laborCost + addCosts;
    const finalPrice = totalCost * (1 + margin / 100);

    return {
      id: id || crypto.randomUUID(),
      clientId: crypto.randomUUID(),
      clientName: formData.clientName,
      clientPhone: formData.clientPhone,
      title: formData.title,
      description: formData.description,
      status: "orcamento",
      width: w, height: h, depth: d,
      materials,
      mdfSheetsList: sheets,
      mdfTotalCost: mdfCost,
      laborDays,
      laborDailyRate,
      laborDurationType: formData.laborDurationType,
      laborCost,
      profitMargin: margin,
      totalCost,
      finalPrice,
      createdAt: new Date().toISOString(),
    };
  };

  const handleSubmit = () => {
    if (!form.title || !form.clientName) return;

    if (editingId) {
      setProjects((prev) => prev.map((p) => {
        if (p.id !== editingId) return p;
        const updated = buildProject(form, editingId);
        updated.status = p.status;
        updated.clientId = p.clientId;
        updated.createdAt = p.createdAt;
        return updated;
      }));
    } else {
      setProjects((prev) => [...prev, buildProject(form)]);
    }
    setForm(INITIAL_FORM);
    setMdfSheets([]);
    setAdditionalCosts([]);
    setEditingId(null);
    setOpen(false);
  };

  const startEdit = (p: Project) => {
    setForm({
      clientName: p.clientName,
      clientPhone: p.clientPhone || "",
      clientAddress: "",
      title: p.title,
      description: p.description,
      width: String(p.width),
      height: String(p.height),
      depth: String(p.depth),
      laborDays: String(p.laborDays || 0),
      laborDailyRate: String(p.laborDailyRate || 0),
      laborDurationType: p.laborDurationType || "dias",
      profitMargin: String(p.profitMargin),
    });
    setMdfSheets(
      (p.mdfSheetsList || []).map(s => ({
        color: s.color,
        quantity: String(s.quantity),
        pricePerSheet: String(s.pricePerSheet),
      }))
    );
    setAdditionalCosts(
      (p.materials || []).map(m => ({
        name: m.name,
        quantity: String(m.quantity),
        unitPrice: String(m.unitPrice),
      }))
    );
    setEditingId(p.id);
    setOpen(true);
  };

  // MDF sheets handlers
  const addMdfSheet = () => {
    setMdfSheets(prev => [...prev, { color: "", quantity: "1", pricePerSheet: "" }]);
  };
  const updateMdfSheet = (index: number, field: keyof MdfSheetItem, value: string) => {
    setMdfSheets(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };
  const removeMdfSheet = (index: number) => {
    setMdfSheets(prev => prev.filter((_, i) => i !== index));
  };

  // Additional costs handlers
  const addCostItem = () => {
    setAdditionalCosts(prev => [...prev, { name: "", quantity: "1", unitPrice: "" }]);
  };
  const updateCostItem = (index: number, field: keyof AdditionalCostItem, value: string) => {
    setAdditionalCosts(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };
  const removeCostItem = (index: number) => {
    setAdditionalCosts(prev => prev.filter((_, i) => i !== index));
  };

  const updateStatus = (id: string, status: ProjectStatus) => {
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)));
  };

  const deleteProject = (id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setEditingId(null);
      setForm(INITIAL_FORM);
      setMdfSheets([]);
      setAdditionalCosts([]);
    }
  };

  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  // Live preview
  const previewMdfCost = mdfSheetsTotal();
  const previewLaborCost = calcLaborCost(parseFloat(form.laborDays) || 0, parseFloat(form.laborDailyRate) || 0, form.laborDurationType);
  const previewAddCosts = additionalCostsTotal();
  const previewTotal = previewMdfCost + previewLaborCost + previewAddCosts;
  const previewFinal = previewTotal * (1 + (parseFloat(form.profitMargin) || 0) / 100);

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="page-header">Projetos</h1>
            <p className="page-subtitle">Gestão de pedidos e clientes</p>
          </div>
          <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="h-4 w-4" /> Novo Projeto</Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingId ? "Editar Projeto" : "Novo Projeto"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                {/* Cliente */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div><Label>Cliente</Label><Input value={form.clientName} onChange={(e) => setForm(f => ({ ...f, clientName: e.target.value }))} placeholder="Nome do cliente" /></div>
                  <div><Label>Telefone</Label><Input value={form.clientPhone} onChange={(e) => setForm(f => ({ ...f, clientPhone: e.target.value }))} placeholder="(00) 00000-0000" /></div>
                </div>
                <div><Label>Endereço</Label><Input value={form.clientAddress} onChange={(e) => setForm(f => ({ ...f, clientAddress: e.target.value }))} /></div>

                {/* Projeto */}
                <div><Label>Título do Projeto</Label><Input value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Ex: Guarda-roupa casal" /></div>
                <div><Label>Descrição</Label><Textarea value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Detalhes do projeto" /></div>

                {/* Medidas */}
                <div>
                  <Label className="flex items-center gap-2"><Ruler className="h-4 w-4" /> Medidas (cm)</Label>
                  <div className="grid grid-cols-3 gap-2 mt-1">
                    <Input type="number" placeholder="Largura" value={form.width} onChange={(e) => setForm(f => ({ ...f, width: e.target.value }))} />
                    <Input type="number" placeholder="Altura" value={form.height} onChange={(e) => setForm(f => ({ ...f, height: e.target.value }))} />
                    <Input type="number" placeholder="Profund." value={form.depth} onChange={(e) => setForm(f => ({ ...f, depth: e.target.value }))} />
                  </div>
                </div>

                {/* Chapas de MDF */}
                <div className="space-y-2 p-3 bg-muted/30 rounded-lg border border-border/50">
                  <div className="flex items-center justify-between">
                    <Label className="font-semibold">🪵 Chapas de MDF</Label>
                    <Button type="button" variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={addMdfSheet}>
                      <Plus className="h-3.5 w-3.5" /> Adicionar Chapa
                    </Button>
                  </div>
                  {mdfSheets.length === 0 && (
                    <p className="text-xs text-muted-foreground">Nenhuma chapa adicionada. Adicione cada tipo de MDF usado no projeto.</p>
                  )}
                  {mdfSheets.map((sheet, i) => (
                    <div key={i} className="grid grid-cols-[1fr_70px_90px_auto] gap-2 items-end">
                      <div>
                        {i === 0 && <Label className="text-xs">Cor / Tipo</Label>}
                        <Input placeholder="Ex: Branco TX" value={sheet.color} onChange={(e) => updateMdfSheet(i, "color", e.target.value)} className="h-8 text-sm" />
                      </div>
                      <div>
                        {i === 0 && <Label className="text-xs">Qtd</Label>}
                        <Input type="number" value={sheet.quantity} onChange={(e) => updateMdfSheet(i, "quantity", e.target.value)} className="h-8 text-sm" />
                      </div>
                      <div>
                        {i === 0 && <Label className="text-xs">R$/Chapa</Label>}
                        <Input type="number" placeholder="0,00" value={sheet.pricePerSheet} onChange={(e) => updateMdfSheet(i, "pricePerSheet", e.target.value)} className="h-8 text-sm" />
                      </div>
                      <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeMdfSheet(i)}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  ))}
                  {mdfSheets.length > 0 && (
                    <div className="text-xs text-muted-foreground space-y-0.5 pt-1 border-t border-border/30">
                      {parsedMdfSheets().map((s, i) => (
                        <p key={i}>{s.color || "Sem cor"}: {s.quantity}x {fmt(s.pricePerSheet)} = {fmt(s.total)}</p>
                      ))}
                      <p className="font-medium">Total chapas MDF: {fmt(previewMdfCost)}</p>
                    </div>
                  )}
                </div>

                {/* Custos Adicionais */}
                <div className="space-y-2 p-3 bg-muted/30 rounded-lg border border-border/50">
                  <div className="flex items-center justify-between">
                    <Label className="font-semibold">🔩 Custos Adicionais</Label>
                    <Button type="button" variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={addCostItem}>
                      <PackagePlus className="h-3.5 w-3.5" /> Adicionar
                    </Button>
                  </div>
                  {additionalCosts.length === 0 && (
                    <p className="text-xs text-muted-foreground">Nenhum custo adicional. Adicione parafusos, dobradiças, corrediças, etc.</p>
                  )}
                  {additionalCosts.map((item, i) => (
                    <div key={i} className="grid grid-cols-[1fr_70px_90px_auto] gap-2 items-end">
                      <div>
                        {i === 0 && <Label className="text-xs">Item</Label>}
                        <Input placeholder="Ex: Dobradiça" value={item.name} onChange={(e) => updateCostItem(i, "name", e.target.value)} className="h-8 text-sm" />
                      </div>
                      <div>
                        {i === 0 && <Label className="text-xs">Qtd</Label>}
                        <Input type="number" value={item.quantity} onChange={(e) => updateCostItem(i, "quantity", e.target.value)} className="h-8 text-sm" />
                      </div>
                      <div>
                        {i === 0 && <Label className="text-xs">R$ Unit.</Label>}
                        <Input type="number" placeholder="0,00" value={item.unitPrice} onChange={(e) => updateCostItem(i, "unitPrice", e.target.value)} className="h-8 text-sm" />
                      </div>
                      <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeCostItem(i)}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  ))}
                  {additionalCosts.length > 0 && (
                    <p className="text-xs text-muted-foreground font-medium">
                      Total custos adicionais: {fmt(previewAddCosts)}
                    </p>
                  )}
                </div>

                {/* Mão de Obra */}
                <div className="space-y-2 p-3 bg-muted/30 rounded-lg border border-border/50">
                  <Label className="font-semibold">🔨 Mão de Obra</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label className="text-xs">Duração</Label>
                      <Input type="number" placeholder="Qtd" value={form.laborDays} onChange={(e) => setForm(f => ({ ...f, laborDays: e.target.value }))} />
                    </div>
                    <div>
                      <Label className="text-xs">Tipo</Label>
                      <Select value={form.laborDurationType} onValueChange={(v) => setForm(f => ({ ...f, laborDurationType: v as LaborDurationType }))}>
                        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="dias">Dias</SelectItem>
                          <SelectItem value="meses">Meses</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Valor/Diária</Label>
                      <Input type="number" placeholder="R$" value={form.laborDailyRate} onChange={(e) => setForm(f => ({ ...f, laborDailyRate: e.target.value }))} />
                    </div>
                  </div>
                  {form.laborDays && form.laborDailyRate && (
                    <p className="text-xs text-muted-foreground">
                      Total mão de obra: {fmt(previewLaborCost)}
                      {form.laborDurationType === "meses" && ` (${(parseFloat(form.laborDays) || 0) * 22} dias úteis)`}
                    </p>
                  )}
                </div>

                {/* Margem e Resumo */}
                <div className="space-y-2 p-3 bg-primary/5 rounded-lg border border-primary/20">
                  <div className="grid grid-cols-2 gap-2">
                    <div><Label className="text-xs">Margem de Lucro %</Label><Input type="number" value={form.profitMargin} onChange={(e) => setForm(f => ({ ...f, profitMargin: e.target.value }))} /></div>
                  </div>
                  <div className="text-xs space-y-0.5 pt-1">
                    <p className="text-muted-foreground">Chapas MDF: {fmt(previewMdfCost)} + Adicionais: {fmt(previewAddCosts)} + Mão de obra: {fmt(previewLaborCost)}</p>
                    <p className="font-semibold">Custo total: {fmt(previewTotal)}</p>
                    <p className="font-bold text-primary text-sm">Preço final: {fmt(previewFinal)}</p>
                    <p className="text-muted-foreground">Lucro estimado: {fmt(previewFinal - previewTotal)}</p>
                  </div>
                </div>

                <Button onClick={handleSubmit} className="w-full">
                  {editingId ? "Salvar Alterações" : "Criar Projeto"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome do projeto, cliente ou telefone..."
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os status</SelectItem>
              {(Object.keys(PROJECT_STATUS_LABELS) as ProjectStatus[]).map((s) => (
                <SelectItem key={s} value={s}>{PROJECT_STATUS_LABELS[s]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {(() => {
          const search = filterSearch.toLowerCase().trim();
          const filtered = [...projects].reverse().filter((p) => {
            if (filterStatus !== "todos" && p.status !== filterStatus) return false;
            if (search && !p.title.toLowerCase().includes(search) && !p.clientName.toLowerCase().includes(search) && !(p.clientPhone || "").toLowerCase().includes(search)) return false;
            return true;
          });
          return filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((p) => (
              <div key={p.id} className="stat-card flex flex-col">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold">{p.title}</h3>
                    <p className="text-sm text-muted-foreground">{p.clientName}</p>
                  </div>
                  <Badge variant="outline" className={PROJECT_STATUS_COLORS[p.status]}>
                    {PROJECT_STATUS_LABELS[p.status]}
                  </Badge>
                </div>
                {p.description && <p className="text-xs text-muted-foreground mb-3">{p.description}</p>}
                <div className="text-xs text-muted-foreground space-y-1 mb-3">
                  <p>📐 {p.width}×{p.height}×{p.depth} cm</p>
                  {p.mdfSheetsList && p.mdfSheetsList.length > 0 && (
                    <p>🪵 {p.mdfSheetsList.reduce((s, m) => s + m.quantity, 0)} chapas MDF: {fmt(p.mdfTotalCost || 0)}</p>
                  )}
                  {p.materials && p.materials.length > 0 && (
                    <p>🔩 {p.materials.length} itens adicionais: {fmt(p.materials.reduce((s, m) => s + m.total, 0))}</p>
                  )}
                  <p>🔨 Mão de obra: {fmt(p.laborCost || 0)}</p>
                  <p>💰 Custo: {fmt(p.totalCost)} | Preço: {fmt(p.finalPrice)}</p>
                  <p>📈 Lucro estimado: {fmt(p.finalPrice - p.totalCost)}</p>
                </div>
                <div className="mt-auto flex items-center gap-2">
                  <Select value={p.status} onValueChange={(v) => updateStatus(p.id, v as ProjectStatus)}>
                    <SelectTrigger className="h-8 text-xs flex-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(Object.keys(PROJECT_STATUS_LABELS) as ProjectStatus[]).map((s) => (
                        <SelectItem key={s} value={s}>{PROJECT_STATUS_LABELS[s]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => exportProjectPdf(p)} title="Exportar PDF">
                    <FileDown className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEdit(p)}>
                    <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteProject(p.id)}>
                    <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          ) : (
          <div className="stat-card text-center py-12">
            <p className="text-muted-foreground">{projects.length === 0 ? 'Nenhum projeto cadastrado. Clique em "Novo Projeto" para começar.' : "Nenhum projeto encontrado com os filtros aplicados."}</p>
          </div>
          );
        })()}
      </div>
    </AppLayout>
  );
}
