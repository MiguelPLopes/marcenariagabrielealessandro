import jsPDF from "jspdf";
import { Project, PROJECT_STATUS_LABELS } from "@/types/marcenaria";

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function exportProjectPdf(p: Project) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  const addLine = (text: string, fontSize = 10, bold = false) => {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
    doc.setFontSize(fontSize);
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.text(text, 14, y);
    y += fontSize * 0.5 + 3;
  };

  const addSeparator = () => {
    doc.setDrawColor(200, 200, 200);
    doc.line(14, y, pageWidth - 14, y);
    y += 6;
  };

  // Header
  doc.setFillColor(62, 39, 20);
  doc.rect(0, 0, pageWidth, 40, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("MarcenaApp", 14, 18);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Orçamento de Projeto", 14, 26);
  doc.setFontSize(8);
  doc.text(`Gerado em: ${new Date().toLocaleDateString("pt-BR")}`, 14, 34);

  y = 50;
  doc.setTextColor(40, 40, 40);

  // Project info
  addLine("INFORMAÇÕES DO PROJETO", 12, true);
  y += 2;
  addLine(`Projeto: ${p.title}`);
  addLine(`Cliente: ${p.clientName}`);
  addLine(`Status: ${PROJECT_STATUS_LABELS[p.status]}`);
  if (p.description) addLine(`Descrição: ${p.description}`);
  addLine(`Medidas: ${p.width} × ${p.height} × ${p.depth} cm`);
  addLine(`Data de criação: ${new Date(p.createdAt).toLocaleDateString("pt-BR")}`);
  y += 4;
  addSeparator();

  // MDF Sheets
  if (p.mdfSheetsList && p.mdfSheetsList.length > 0) {
    addLine("CHAPAS DE MDF", 12, true);
    y += 2;

    // Table header
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setFillColor(245, 240, 235);
    doc.rect(14, y - 4, pageWidth - 28, 8, "F");
    doc.text("Cor / Tipo", 16, y);
    doc.text("Qtd", 100, y);
    doc.text("R$/Chapa", 125, y);
    doc.text("Total", 165, y);
    y += 8;

    doc.setFont("helvetica", "normal");
    p.mdfSheetsList.forEach((s) => {
      doc.text(s.color || "Sem cor", 16, y);
      doc.text(String(s.quantity), 100, y);
      doc.text(fmt(s.pricePerSheet), 125, y);
      doc.text(fmt(s.total), 165, y);
      y += 6;
    });

    doc.setFont("helvetica", "bold");
    doc.text(`Total MDF: ${fmt(p.mdfTotalCost || 0)}`, 125, y);
    y += 8;
    addSeparator();
  }

  // Additional costs
  if (p.materials && p.materials.length > 0) {
    addLine("CUSTOS ADICIONAIS", 12, true);
    y += 2;

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setFillColor(245, 240, 235);
    doc.rect(14, y - 4, pageWidth - 28, 8, "F");
    doc.text("Item", 16, y);
    doc.text("Qtd", 100, y);
    doc.text("R$ Unit.", 125, y);
    doc.text("Total", 165, y);
    y += 8;

    doc.setFont("helvetica", "normal");
    const addTotal = p.materials.reduce((sum, m) => {
      doc.text(m.name, 16, y);
      doc.text(String(m.quantity), 100, y);
      doc.text(fmt(m.unitPrice), 125, y);
      doc.text(fmt(m.total), 165, y);
      y += 6;
      return sum + m.total;
    }, 0);

    doc.setFont("helvetica", "bold");
    doc.text(`Total adicionais: ${fmt(addTotal)}`, 125, y);
    y += 8;
    addSeparator();
  }

  // Labor
  addLine("MÃO DE OBRA", 12, true);
  y += 2;
  const totalDays = p.laborDurationType === "meses" ? (p.laborDays || 0) * 22 : (p.laborDays || 0);
  addLine(`Duração: ${p.laborDays || 0} ${p.laborDurationType || "dias"}${p.laborDurationType === "meses" ? ` (${totalDays} dias úteis)` : ""}`);
  addLine(`Valor da diária: ${fmt(p.laborDailyRate || 0)}`);
  addLine(`Total mão de obra: ${fmt(p.laborCost || 0)}`, 10, true);
  y += 4;
  addSeparator();

  // Summary
  doc.setFillColor(62, 39, 20);
  doc.rect(14, y - 4, pageWidth - 28, 40, "F");
  doc.setTextColor(255, 255, 255);

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("RESUMO FINANCEIRO", 20, y + 2);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Custo total: ${fmt(p.totalCost)}`, 20, y + 12);
  doc.text(`Margem de lucro: ${p.profitMargin}%`, 20, y + 20);

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(`Preço final: ${fmt(p.finalPrice)}`, 20, y + 30);

  doc.save(`orcamento-${p.title.replace(/\s+/g, "-").toLowerCase()}.pdf`);
}
