import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {ollama} from 'genkitx-ollama';

export const ai = genkit({
  plugins: [
    googleAI(),
    ollama({
      // You might need to configure the serverAddress if Ollama isn't running on localhost:11434
      // serverAddress: 'http://localhost:11434', 
      // Default request timeout for Ollama calls.
      // requestTimeout: 120000, // 2 minutes
    }),
  ],
  // This is the global default model if no model is specified in a flow/prompt.
  // You can still override it per call.
  model: 'googleai/gemini-2.0-flash', 
});
