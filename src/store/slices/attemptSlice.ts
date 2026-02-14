import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { AttemptAnswerInput, StartAttemptResponse } from "@/types/domain";

export interface AttemptState {
  current: StartAttemptResponse | null;
  answersByQuestionId: Record<number, AttemptAnswerInput>;
  submitInFlight: boolean;
  error: string | null;
}

const initialState: AttemptState = {
  current: null,
  answersByQuestionId: {},
  submitInFlight: false,
  error: null,
};

const attemptSlice = createSlice({
  name: "attempt",
  initialState,
  reducers: {
    setCurrentAttempt: (state, action: PayloadAction<StartAttemptResponse>) => {
      state.current = action.payload;
      state.error = null;

      const defaults: Record<number, AttemptAnswerInput> = {};
      action.payload.test.questions.forEach((question) => {
        defaults[question.id] = { questionId: question.id, selectedOptionIds: [] };
      });
      state.answersByQuestionId = defaults;
    },
    setAnswer: (state, action: PayloadAction<AttemptAnswerInput>) => {
      const current = state.answersByQuestionId[action.payload.questionId] ?? { questionId: action.payload.questionId };
      state.answersByQuestionId[action.payload.questionId] = {
        ...current,
        ...action.payload,
      };
    },
    setAttemptError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setSubmitInFlight: (state, action: PayloadAction<boolean>) => {
      state.submitInFlight = action.payload;
    },
    clearAttempt: () => initialState,
  },
});

export const { setCurrentAttempt, setAnswer, clearAttempt, setSubmitInFlight, setAttemptError } = attemptSlice.actions;
export const attemptReducer = attemptSlice.reducer;
