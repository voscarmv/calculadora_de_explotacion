import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface CareerState {
  embeddings: { rama: string, vector: number[] }[];
  isDataReady: boolean;
  queryInput: string;
  results: { rama: string, score: number }[];
  isExtracting: boolean;
}

const initialState: CareerState = {
  embeddings: [],
  isDataReady: false,
  queryInput: '',
  results: [],
  isExtracting: false
};

const careerSlice = createSlice({
  name: 'career',
  initialState,
  reducers: {
    setEmbeddings(state, action: PayloadAction<{ rama: string, vector: number[] }[]>) {
      state.embeddings = action.payload;
      state.isDataReady = true;
    },
    setQueryInput(state, action: PayloadAction<string>) {
      state.queryInput = action.payload;
    },
    setResults(state, action: PayloadAction<{ rama: string, score: number }[]>) {
      state.results = action.payload;
    },
    setExtracting(state, action: PayloadAction<boolean>) {
      state.isExtracting = action.payload;
    }
  }
});

export const { setEmbeddings, setQueryInput, setResults, setExtracting } = careerSlice.actions;
export default careerSlice.reducer;
