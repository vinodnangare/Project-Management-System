import { createSlice } from '@reduxjs/toolkit';

interface UIModalState {
  showProfileModal: boolean;
}

const initialState: UIModalState = {
  showProfileModal: false
};

const uiModalSlice = createSlice({
  name: 'uiModal',
  initialState,
  reducers: {
    openProfileModal: (state) => {
      state.showProfileModal = true;
    },
    closeProfileModal: (state) => {
      state.showProfileModal = false;
    }
  }
});

export const { openProfileModal, closeProfileModal } = uiModalSlice.actions;
export default uiModalSlice.reducer;
