import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(num: number): string {
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + "M";
  if (num >= 1_000) return (num / 1_000).toFixed(1) + "K";
  return num.toLocaleString();
}

export function formatCurrency(num: number): string {
  if (num >= 10_000_000) return "₹" + (num / 10_000_000).toFixed(1) + "Cr";
  if (num >= 100_000) return "₹" + (num / 100_000).toFixed(1) + "L";
  if (num >= 1_000) return "₹" + (num / 1_000).toFixed(1) + "K";
  return "₹" + num.toLocaleString("en-IN");
}

export function formatPercent(num: number): string {
  return (num >= 0 ? "+" : "") + num.toFixed(1) + "%";
}

export function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "Just now";
  if (seconds < 3600) return Math.floor(seconds / 60) + "m ago";
  if (seconds < 86400) return Math.floor(seconds / 3600) + "h ago";
  return Math.floor(seconds / 86400) + "d ago";
}

export function formatDate(date: Date | string | number): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) return "-";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export function formatTime(date: Date | string | number): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) return "-";
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12;
  const strHours = String(hours).padStart(2, "0");
  return `${strHours}:${minutes} ${ampm}`;
}

export function formatDateTime(date: Date | string | number): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) return "-";
  return `${formatDate(d)} ${formatTime(d)}`;
}
