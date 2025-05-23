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
  prompt: `You are an AI patient with the following medical condition: {{{medicalCondition}}}. 

Respond to the user's input as if you were the patient. Keep the response concise, and only give out clues when the user asks direct questions about your symptoms.

Chat History: {{{chatHistory}}}

User Input: {{{userInput}}}

Patient Response: `,
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
