import { createSlice } from '@reduxjs/toolkit';

interface SubtasksState {
  newSubtaskTitle: string;
  newSubtaskDescription: string;
  showAddForm: boolean;
}

const initialState: SubtasksState = {
  newSubtaskTitle: '',
  newSubtaskDescription: '',
  showAddForm: false
};

const subtaskFormSlice = createSlice({
  name: 'subtaskForm',
  initialState,
  reducers: {
    setNewSubtaskTitle: (state, action) => {
      state.newSubtaskTitle = action.payload;
    },
    setNewSubtaskDescription: (state, action) => {
      state.newSubtaskDescription = action.payload;
    },
    setShowAddForm: (state, action) => {
      state.showAddForm = action.payload;
    },
    clearSubtaskForm: (state) => {
      state.newSubtaskTitle = '';
      state.newSubtaskDescription = '';
      state.showAddForm = false;
    }
  }
});

export const { setNewSubtaskTitle, setNewSubtaskDescription, setShowAddForm, clearSubtaskForm } = subtaskFormSlice.actions;
export default subtaskFormSlice.reducer;
