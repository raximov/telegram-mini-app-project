import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { UserProfile } from "@/types/domain";
import { loadPersistedUser } from "@/store/persistence";

export interface UserState {
  profile: UserProfile | null;
}

const initialState: UserState = {
  profile: loadPersistedUser(),
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setProfile: (state, action: PayloadAction<UserProfile | null>) => {
      state.profile = action.payload;
    },
    clearProfile: (state) => {
      state.profile = null;
    },
  },
});

export const { setProfile, clearProfile } = userSlice.actions;
export const userReducer = userSlice.reducer;
