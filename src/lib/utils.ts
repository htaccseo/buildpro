import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date | number, formatStr: string = 'MMM d, yyyy'): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'N/A';
  return format(d, formatStr);
}
