import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface CareerState {
  embeddings: { rama: string, vector: number[] }[];
  isModelReady: boolean;
  isExtracting: boolean;
  queryInput: string;
  results: { rama: string, score: number }[];
}

const initialState: CareerState = {
  embeddings: [],
  isModelReady: false,
  isExtracting: false,
  queryInput: '',
  results: []
};

const careerSlice = createSlice({
  name: 'career',
  initialState,
  reducers: {
    setEmbeddings(state, action: PayloadAction<{ rama: string, vector: number[] }[]>) {
      state.embeddings = action.payload;
    },
    setModelReady(state, action: PayloadAction<boolean>) {
      state.isModelReady = action.payload;
    },
    setExtracting(state, action: PayloadAction<boolean>) {
      state.isExtracting = action.payload;
    },
    setQueryInput(state, action: PayloadAction<string>) {
      state.queryInput = action.payload;
    },
    setResults(state, action: PayloadAction<{ rama: string, score: number }[]>) {
      state.results = action.payload;
    }
  }
});

export const { setEmbeddings, setModelReady, setExtracting, setQueryInput, setResults } = careerSlice.actions;
export default careerSlice.reducer;
