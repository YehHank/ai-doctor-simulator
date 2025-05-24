
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
// import {ollama} from 'genkitx-ollama'; // Temporarily commented out

export const ai = genkit({
  plugins: [
    googleAI(),
    // ollama({ // Temporarily commented out
    //   // You might need to configure the serverAddress if Ollama isn't running on localhost:11434
    //   // serverAddress: 'http://localhost:11434', 
    //   // Default request timeout for Ollama calls.
    //   // requestTimeout: 120000, // 2 minutes
    // }),
  ],
  // This is the global default model if no model is specified in a flow/prompt.
  // You can still override it per call.
  model: process.env.GENKIT_DEFAULT_MODEL_NAME || 'googleai/gemini-2.0-flash', 
});
