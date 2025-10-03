export interface PasswordEntry {
  id: string;
  title: string;
  username: string;
  password: string;
  website?: string;
  notes?: string;
  category: string;
  isFavorite: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Serialized version for Redux store (dates as strings)
export interface SerializedPasswordEntry {
  id: string;
  title: string;
  username: string;
  password: string;
  website?: string;
  notes?: string;
  category: string;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PasswordCategory {
  id: string;
  name: string;
  color: string;
  icon: string;
}

export interface GeneratorOptions {
  length: number;
  includeUppercase: boolean;
  includeLowercase: boolean;
  includeNumbers: boolean;
  includeSymbols: boolean;
  excludeSimilar: boolean;
}