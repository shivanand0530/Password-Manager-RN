import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { PasswordCategory } from '../../types/password';

interface CategoriesState {
  categories: PasswordCategory[];
  selectedCategoryId: string | null;
}

const defaultCategories: PasswordCategory[] = [
  { id: '1', name: 'Social Media', color: '#3B82F6', icon: 'users' },
  { id: '2', name: 'Work', color: '#10B981', icon: 'briefcase' },
  { id: '3', name: 'Banking', color: '#F59E0B', icon: 'credit-card' },
  { id: '4', name: 'Shopping', color: '#EF4444', icon: 'shopping-cart' },
  { id: '5', name: 'Entertainment', color: '#8B5CF6', icon: 'play-circle' },
  { id: '6', name: 'Other', color: '#6B7280', icon: 'folder' },
];

const initialState: CategoriesState = {
  categories: defaultCategories,
  selectedCategoryId: null,
};

const categoriesSlice = createSlice({
  name: 'categories',
  initialState,
  reducers: {
    addCategory: (state, action: PayloadAction<Omit<PasswordCategory, 'id'>>) => {
      const newCategory: PasswordCategory = {
        ...action.payload,
        id: Date.now().toString(),
      };
      state.categories.push(newCategory);
    },
    updateCategory: (state, action: PayloadAction<PasswordCategory>) => {
      const index = state.categories.findIndex(cat => cat.id === action.payload.id);
      if (index !== -1) {
        state.categories[index] = action.payload;
      }
    },
    deleteCategory: (state, action: PayloadAction<string>) => {
      state.categories = state.categories.filter(cat => cat.id !== action.payload);
      if (state.selectedCategoryId === action.payload) {
        state.selectedCategoryId = null;
      }
    },
    setSelectedCategory: (state, action: PayloadAction<string | null>) => {
      state.selectedCategoryId = action.payload;
    },
  },
});

export const { addCategory, updateCategory, deleteCategory, setSelectedCategory } = categoriesSlice.actions;

// Selectors
export const selectAllCategories = (state: { categories: CategoriesState }) => state.categories.categories;
export const selectSelectedCategoryId = (state: { categories: CategoriesState }) => state.categories.selectedCategoryId;
export const selectCategoryById = (id: string) => (state: { categories: CategoriesState }) => 
  state.categories.categories.find(cat => cat.id === id);

export default categoriesSlice.reducer;