export type TransactionType = 'entrada' | 'saida';

export interface Transaction {
  id: string;
  type: TransactionType;
  description: string;
  amount: number;
  category: string;
  date: string;
  projectId?: string;
}

export type ProjectStatus = 'orcamento' | 'producao' | 'finalizado' | 'entregue';

export interface Client {
  id: string;
  name: string;
  phone: string;
  address: string;
}

export interface ProjectMaterial {
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface MdfSheet {
  color: string;
  quantity: number;
  pricePerSheet: number;
  total: number;
}

export type LaborDurationType = 'dias' | 'meses';

export interface Project {
  id: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  title: string;
  description: string;
  status: ProjectStatus;
  width: number;
  height: number;
  depth: number;
  materials: ProjectMaterial[];
  mdfSheetsList: MdfSheet[];
  mdfTotalCost: number;
  laborDays: number;
  laborDailyRate: number;
  laborDurationType: LaborDurationType;
  laborCost: number;
  profitMargin: number;
  totalCost: number;
  finalPrice: number;
  createdAt: string;
}

export interface StockItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  minStock: number;
  pricePerUnit: number;
}

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  orcamento: 'Orçamento',
  producao: 'Em Produção',
  finalizado: 'Finalizado',
  entregue: 'Entregue',
};

export const PROJECT_STATUS_COLORS: Record<ProjectStatus, string> = {
  orcamento: 'bg-warning/15 text-warning-foreground border-warning/30',
  producao: 'bg-primary/10 text-primary border-primary/30',
  finalizado: 'bg-success/15 text-success border-success/30',
  entregue: 'bg-muted text-muted-foreground border-border',
};

export const EXPENSE_CATEGORIES = [
  'Material (MDF)',
  'Ferragens',
  'Ferramentas',
  'Transporte',
  'Mão de obra',
  'Aluguel',
  'Energia',
  'Outros',
];
