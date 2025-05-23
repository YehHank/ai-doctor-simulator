
// This file contains the Genkit flow for providing feedback on the user's diagnosis attempts.

'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ProvideDiagnosisFeedbackInputSchema = z.object({
  diagnosisAttempt: z.string().describe('The user\'s diagnosis attempt.'),
  correctDiagnosis: z.string().describe('The actual correct diagnosis.'),
  patientClues: z.string().describe('Clues about the patient provided to the user.'),
  modelName: z.string().optional().describe('The AI model to use (e.g., googleai/gemini-2.0-flash, ollama/mistral). If not provided, uses default.'),
});

export type ProvideDiagnosisFeedbackInput = z.infer<typeof ProvideDiagnosisFeedbackInputSchema>;

const ProvideDiagnosisFeedbackOutputSchema = z.object({
  feedback: z.string().describe('Feedback on the user\'s diagnosis attempt, including hints or suggestions.'),
  isCorrect: z.boolean().describe('Whether the diagnosis attempt was correct.'),
});

export type ProvideDiagnosisFeedbackOutput = z.infer<typeof ProvideDiagnosisFeedbackOutputSchema>;

export async function provideDiagnosisFeedback(input: ProvideDiagnosisFeedbackInput): Promise<ProvideDiagnosisFeedbackOutput> {
  return provideDiagnosisFeedbackFlow(input);
}

const provideDiagnosisFeedbackPrompt = ai.definePrompt({
  name: 'provideDiagnosisFeedbackPrompt',
  // The default model for this prompt is taken from ai.ts if not overridden at call time
  input: {schema: ProvideDiagnosisFeedbackInputSchema.omit({modelName: true})}, // modelName is not part of the prompt's direct input variables
  output: {schema: ProvideDiagnosisFeedbackOutputSchema},
  prompt: `你是一位醫學專家，正在為嘗試診斷病患狀況的使用者提供回饋。

  使用者嘗試了以下診斷：{{{diagnosisAttempt}}}
  正確的診斷是：{{{correctDiagnosis}}}
  已向使用者提供了有關病患的以下線索：{{{patientClues}}}

  向使用者提供回饋，說明他們距離正確診斷有多近。
  包括具體的提示或建議，以引導他們找到正確答案。
  同時，透過設定 isCorrect 欄位來指示診斷嘗試是否正確。
  如果答案不正確，請不要洩露答案。
  回答請簡潔，控制在 50 字以內。請使用繁體中文回答。
  `,
});

const provideDiagnosisFeedbackFlow = ai.defineFlow(
  {
    name: 'provideDiagnosisFeedbackFlow',
    inputSchema: ProvideDiagnosisFeedbackInputSchema,
    outputSchema: ProvideDiagnosisFeedbackOutputSchema,
  },
  async (input) => {
    // Prepare prompt data, excluding modelName as it's not part of the Handlebars template
    const promptData = {
      diagnosisAttempt: input.diagnosisAttempt,
      correctDiagnosis: input.correctDiagnosis,
      patientClues: input.patientClues,
    };
    
    const {output} = await provideDiagnosisFeedbackPrompt(
      promptData,
      input.modelName ? { model: input.modelName } : {}
    );
    return output!;
  }
);
