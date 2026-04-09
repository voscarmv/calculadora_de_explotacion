import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface CareerState {
  embeddings: { rama: string, vector: number[] }[];
  datos: Record<string, { HRS_PARA_SALARIO: number, HRS_PARA_INFRAESTRUCTURA: number, HRS_PLUSVALIA_NETA: number, TASA_EXPLOTACION: string }>;
  isDataReady: boolean;
  
  step: number;
  queryInput: string;
  results: { rama: string, score: number }[];
  selectedRama: string | null;
  salary: string;
  hours: string;
  isExtracting: boolean;
}

const initialState: CareerState = {
  embeddings: [],
  datos: {},
  isDataReady: false,
  step: 1, // Start directly at step 1
  queryInput: '',
  results: [],
  selectedRama: null,
  salary: '',
  hours: '',
  isExtracting: false
};

const careerSlice = createSlice({
  name: 'career',
  initialState,
  reducers: {
    setInitialData(state, action: PayloadAction<{ embeddings: any[], datos: any }>) {
      state.embeddings = action.payload.embeddings;
      state.datos = action.payload.datos;
      state.isDataReady = true;
    },
    nextStep(state) {
      state.step += 1;
    },
    setStep(state, action: PayloadAction<number>) {
      state.step = action.payload;
    },
    setQueryInput(state, action: PayloadAction<string>) {
      state.queryInput = action.payload;
    },
    setResults(state, action: PayloadAction<{ rama: string, score: number }[]>) {
      state.results = action.payload;
    },
    setSelectedRama(state, action: PayloadAction<string | null>) {
      state.selectedRama = action.payload;
    },
    setSalary(state, action: PayloadAction<string>) {
      state.salary = action.payload;
    },
    setHours(state, action: PayloadAction<string>) {
      state.hours = action.payload;
    },
    setExtracting(state, action: PayloadAction<boolean>) {
      state.isExtracting = action.payload;
    }
  }
});

export const { setInitialData, nextStep, setStep, setQueryInput, setResults, setSelectedRama, setSalary, setHours, setExtracting } = careerSlice.actions;
export default careerSlice.reducer;
