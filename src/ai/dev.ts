import { config } from 'dotenv';
config();

import '@/ai/flows/generate-patient-response.ts';
import '@/ai/flows/provide-diagnosis-feedback.ts';