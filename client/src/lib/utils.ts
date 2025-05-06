import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string | undefined | null): string {
  if (!date) return "";
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) return "";
    
    return dateObj.toLocaleDateString('pt-BR');
  } catch (error) {
    return "";
  }
}

export function formatCurrency(value: number | string | undefined | null): string {
  if (value === null || value === undefined) return "";
  
  try {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return numValue.toLocaleString('pt-BR', { 
      style: 'currency', 
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  } catch (error) {
    return "";
  }
}

export function formatWeight(value: number | undefined | null): string {
  if (value === null || value === undefined) return "";
  return `${value.toFixed(2)} kg`;
}

export function calcularRendimento(pesoVivo: number, pesoAbatido: number): number {
  if (!pesoVivo || !pesoAbatido) return 0;
  return (pesoAbatido / pesoVivo) * 100;
}

export function generateCode(prefix: string, id: number): string {
  return `${prefix}-${String(id).padStart(3, '0')}`;
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
}
