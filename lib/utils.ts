import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

// Merge class names with tailwind
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a blockchain address for display by showing the first 6 and last 4 characters
 */
export function formatAddress(address: string | undefined): string {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Formats a date for display
 */
export function formatDate(date: string | number | Date): string {
  return new Date(date).toLocaleString();
}

/**
 * Checks if string is a valid URL
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Formats an amount of ETH for display
 */
export function formatEthAmount(amount: string | number | undefined): string {
  if (!amount) return '0.00 ETH';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return `${num.toFixed(6)} ETH`;
} 