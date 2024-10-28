import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

type CategoryColor = {
  bg: string;
  text: string;
  border: string;
}

export function getColorForCategory(category: string | null | undefined): CategoryColor {
  if (!category) return { bg: 'bg-gray-200', text: 'text-gray-700', border: 'border-gray-300' }

  switch (category.toLowerCase()) {
    case 'work':
      return { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' }
    case 'personal':
      return { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' }
    case 'shopping':
      return { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-300' }
    case 'health':
      return { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300' }
    case 'completed':
      return { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300' }
    case 'all':
      return { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300' }
    default:
      return { bg: 'bg-gray-200', text: 'text-gray-700', border: 'border-gray-300' }
  }
}
