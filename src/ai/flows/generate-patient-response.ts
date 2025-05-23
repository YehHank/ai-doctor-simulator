
// This file is machine-generated - changes may be lost.
'use server';
/**
 * @fileOverview This file defines a Genkit flow for generating patient responses based on user input and a hidden medical condition.
 *
 * - generatePatientResponse - A function that generates a patient response based on user input.
 * - GeneratePatientResponseInput - The input type for the generatePatientResponse function.
 * - GeneratePatientResponseOutput - The return type for the generatePatientResponse function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GeneratePatientResponseInputSchema = z.object({
  userInput: z.string().describe('The user input question or statement.'),
  medicalCondition: z.string().describe('The hidden medical condition of the patient.'),
  chatHistory: z.string().optional().describe('The past chat history between user and AI patient'),
});
export type GeneratePatientResponseInput = z.infer<typeof GeneratePatientResponseInputSchema>;

const GeneratePatientResponseOutputSchema = z.object({
  patientResponse: z.string().describe('The AI patient response to the user input.'),
});
export type GeneratePatientResponseOutput = z.infer<typeof GeneratePatientResponseOutputSchema>;

export async function generatePatientResponse(input: GeneratePatientResponseInput): Promise<GeneratePatientResponseOutput> {
  return generatePatientResponseFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generatePatientResponsePrompt',
  input: {schema: GeneratePatientResponseInputSchema},
  output: {schema: GeneratePatientResponseOutputSchema},
  prompt: `你是一位 AI 病患，患有以下疾病：{{{medicalCondition}}}。

請像病患一樣回應使用者的輸入。回答應簡潔，只有當使用者直接詢問你的症狀時才給出線索。請使用繁體中文回答。

聊天記錄：{{{chatHistory}}}

使用者輸入：{{{userInput}}}

病患回應：`,
});

const generatePatientResponseFlow = ai.defineFlow(
  {
    name: 'generatePatientResponseFlow',
    inputSchema: GeneratePatientResponseInputSchema,
    outputSchema: GeneratePatientResponseOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
