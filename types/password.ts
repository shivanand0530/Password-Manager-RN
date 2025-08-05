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