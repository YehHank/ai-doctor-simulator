// This file contains the Genkit flow for providing feedback on the user's diagnosis attempts.

'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ProvideDiagnosisFeedbackInputSchema = z.object({
  diagnosisAttempt: z.string().describe('The user\'s diagnosis attempt.'),
  correctDiagnosis: z.string().describe('The actual correct diagnosis.'),
  patientClues: z.string().describe('Clues about the patient provided to the user.'),
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
  input: {schema: ProvideDiagnosisFeedbackInputSchema},
  output: {schema: ProvideDiagnosisFeedbackOutputSchema},
  prompt: `You are a medical expert providing feedback to a user who is attempting to diagnose a patient's condition.

  The user has made the following diagnosis attempt: {{{diagnosisAttempt}}}
  The correct diagnosis is: {{{correctDiagnosis}}}
  The following clues have been provided to the user about the patient: {{{patientClues}}}

  Provide feedback to the user, indicating how close they are to the correct diagnosis.
  Include specific hints or suggestions to guide them towards the correct answer.
  Also, indicate whether the diagnosis attempt was correct by setting the isCorrect field.
  If the answer is not correct, do not give away the answer.
  Keep it brief, within 50 words.
  `,
});

const provideDiagnosisFeedbackFlow = ai.defineFlow(
  {
    name: 'provideDiagnosisFeedbackFlow',
    inputSchema: ProvideDiagnosisFeedbackInputSchema,
    outputSchema: ProvideDiagnosisFeedbackOutputSchema,
  },
  async input => {
    const {output} = await provideDiagnosisFeedbackPrompt(input);
    return output!;
  }
);
