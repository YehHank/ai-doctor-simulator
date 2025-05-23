'use client';

import { useState, useEffect, useRef, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { generatePatientResponse } from '@/ai/flows/generate-patient-response';
import { provideDiagnosisFeedback } from '@/ai/flows/provide-diagnosis-feedback';
import { getRandomCondition } from '@/config/conditions';
import type { Message } from '@/types';
import ChatMessageItem from '@/components/ChatMessageItem';
import AppHeader from '@/components/AppHeader';
import { SendHorizonal, Lightbulb, RotateCcw, Loader2 } from 'lucide-react';

const ChatPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState('');
  const [currentCondition, setCurrentCondition] = useState<string>('');
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [isLoadingFeedback, setIsLoadingFeedback] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const formatChatHistory = (history: Message[]): string => {
    return history
      .filter(msg => msg.sender === 'user' || msg.sender === 'ai')
      .map(msg => `${msg.sender === 'user' ? 'User' : 'Patient'}: ${msg.text}`)
      .join('\n');
  };

  const initializeGame = () => {
    const newCondition = getRandomCondition();
    setCurrentCondition(newCondition);
    setMessages([
      {
        id: crypto.randomUUID(),
        text: `Hello! I'm not feeling too well today. Ask me some questions to figure out what's wrong. (The condition is: ${newCondition} for testing, this will be hidden)`,
        sender: 'system',
        timestamp: new Date(),
      },
    ]);
    setGameOver(false);
    setUserInput('');
  };

  useEffect(() => {
    initializeGame();
  }, []);

  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [messages]);

  const addMessage = (text: string, sender: Message['sender'], isFeedback = false, isError = false) => {
    setMessages(prev => [
      ...prev,
      { id: crypto.randomUUID(), text, sender, timestamp: new Date(), isFeedback, isError },
    ]);
  };

  const handleSendMessage = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!userInput.trim() || isLoadingAI || gameOver) return;

    const userMessageText = userInput;
    addMessage(userMessageText, 'user');
    setUserInput('');
    setIsLoadingAI(true);

    try {
      const historyForAI = formatChatHistory([...messages, { id: '', text: userMessageText, sender: 'user', timestamp: new Date() }]);
      const response = await generatePatientResponse({
        userInput: userMessageText,
        medicalCondition: currentCondition,
        chatHistory: historyForAI,
      });
      addMessage(response.patientResponse, 'ai');
    } catch (error) {
      console.error('Error generating patient response:', error);
      addMessage('Sorry, I encountered an error. Please try again.', 'system', false, true);
      toast({
        title: 'Error',
        description: 'Could not get response from AI patient.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingAI(false);
    }
  };

  const handleSubmitDiagnosis = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!userInput.trim() || isLoadingFeedback || gameOver) return;

    const diagnosisAttempt = userInput;
    addMessage(`My diagnosis attempt: ${diagnosisAttempt}`, 'user');
    setUserInput('');
    setIsLoadingFeedback(true);

    try {
      const clues = formatChatHistory(messages);
      const feedbackResponse = await provideDiagnosisFeedback({
        diagnosisAttempt,
        correctDiagnosis: currentCondition,
        patientClues: clues,
      });

      addMessage(feedbackResponse.feedback, 'system', true);

      if (feedbackResponse.isCorrect) {
        setGameOver(true);
        addMessage(
          `Congratulations! You correctly diagnosed ${currentCondition}.`,
          'system',
          true
        );
        toast({
          title: 'Diagnosis Correct!',
          description: `You successfully diagnosed ${currentCondition}.`,
        });
      }
    } catch (error) {
      console.error('Error providing diagnosis feedback:', error);
      addMessage('Sorry, I encountered an error processing your diagnosis. Please try again.', 'system', false, true);
      toast({
        title: 'Error',
        description: 'Could not process diagnosis.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingFeedback(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <AppHeader />
      <main className="flex-grow container mx-auto py-6 flex justify-center items-start">
        <Card className="w-full max-w-2xl shadow-xl flex flex-col h-[calc(100vh-150px)]">
          <CardHeader className="border-b">
            <CardTitle className="text-center text-xl text-foreground/80">AI Patient Chat</CardTitle>
          </CardHeader>
          <CardContent className="flex-grow p-0 overflow-hidden">
            <ScrollArea className="h-full p-4" ref={scrollAreaRef}>
              {messages.map(msg => (
                <ChatMessageItem key={msg.id} message={msg} />
              ))}
              {(isLoadingAI || isLoadingFeedback) && (
                <div className="flex justify-start items-center p-2">
                  <Loader2 className="h-5 w-5 text-muted-foreground animate-spin mr-2" />
                  <span className="text-sm text-muted-foreground">AI is thinking...</span>
                </div>
              )}
            </ScrollArea>
          </CardContent>
          <CardFooter className="p-4 border-t">
            {gameOver ? (
              <Button onClick={initializeGame} className="w-full" variant="default">
                <RotateCcw className="mr-2 h-4 w-4" /> Play Again
              </Button>
            ) : (
              <form onSubmit={handleSendMessage} className="w-full flex gap-2">
                <Input
                  type="text"
                  placeholder="Type your message or diagnosis..."
                  value={userInput}
                  onChange={e => setUserInput(e.target.value)}
                  disabled={isLoadingAI || isLoadingFeedback || gameOver}
                  className="flex-grow"
                />
                <Button
                  type="submit"
                  disabled={isLoadingAI || isLoadingFeedback || !userInput.trim()}
                  variant="default"
                  aria-label="Send message"
                >
                  {isLoadingAI ? <Loader2 className="animate-spin" /> : <SendHorizonal />}
                  <span className="ml-2 hidden sm:inline">Send</span>
                </Button>
                <Button
                  type="button"
                  onClick={handleSubmitDiagnosis}
                  disabled={isLoadingAI || isLoadingFeedback || !userInput.trim()}
                  variant="outline"
                  aria-label="Submit diagnosis"
                  className="border-accent text-accent hover:bg-accent/10 hover:text-accent"
                >
                  {isLoadingFeedback ? <Loader2 className="animate-spin" /> : <Lightbulb />}
                   <span className="ml-2 hidden sm:inline">Diagnose</span>
                </Button>
              </form>
            )}
          </CardFooter>
        </Card>
      </main>
    </div>
  );
};

export default ChatPage;
