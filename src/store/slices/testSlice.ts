import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface TestState {
  selectedTestId: number | null;
  studentFilter: "all" | "open" | "completed";
  teacherBuilderDirty: boolean;
}

const initialState: TestState = {
  selectedTestId: null,
  studentFilter: "all",
  teacherBuilderDirty: false,
};

const testSlice = createSlice({
  name: "test",
  initialState,
  reducers: {
    setSelectedTestId: (state, action: PayloadAction<number | null>) => {
      state.selectedTestId = action.payload;
    },
    setStudentFilter: (state, action: PayloadAction<TestState["studentFilter"]>) => {
      state.studentFilter = action.payload;
    },
    setTeacherBuilderDirty: (state, action: PayloadAction<boolean>) => {
      state.teacherBuilderDirty = action.payload;
    },
    resetTestState: () => initialState,
  },
});

export const { setSelectedTestId, setStudentFilter, setTeacherBuilderDirty, resetTestState } = testSlice.actions;
export const testReducer = testSlice.reducer;
