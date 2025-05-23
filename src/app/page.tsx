
'use client';

import { useState, useEffect, useRef, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { generatePatientResponse } from '@/ai/flows/generate-patient-response';
import { provideDiagnosisFeedback } from '@/ai/flows/provide-diagnosis-feedback';
import { getRandomCondition } from '@/config/conditions';
import type { Message } from '@/types';
import ChatMessageItem from '@/components/ChatMessageItem';
import AppHeader from '@/components/AppHeader';
import { SendHorizonal, Lightbulb, RotateCcw, Loader2, Trophy, Clock, SkipForward, Play } from 'lucide-react';

const ROUND_DURATION_SECONDS = 300; // 5 minutes
const DEFAULT_MODEL_NAME = 'googleai/gemini-2.0-flash'; // Or 'ollama/mistral' for Ollama (ensure Ollama is running and 'mistral' model is available)

const ChatPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState('');
  const [currentCondition, setCurrentCondition] = useState<string>('');
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [isLoadingFeedback, setIsLoadingFeedback] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(ROUND_DURATION_SECONDS);
  const [isTimeUpDialogOpen, setIsTimeUpDialogOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>(DEFAULT_MODEL_NAME);
  const [timerVersion, setTimerVersion] = useState(0);


  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  const formatChatHistory = (history: Message[]): string => {
    return history
      .filter(msg => msg.sender === 'user' || msg.sender === 'ai')
      .map(msg => `${msg.sender === 'user' ? '使用者' : '病患'}: ${msg.text}`)
      .join('\n');
  };

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const initializeGame = (resetScoreFlag = false, resetTimerFlag = true) => {
    clearTimer(); // Always clear timer first
    const newCondition = getRandomCondition();
    setCurrentCondition(newCondition);
    setMessages([
      {
        id: crypto.randomUUID(),
        text: `你好！我今天感覺不太舒服。問我一些問題來弄清楚是哪裡出了問題。`,
        sender: 'system',
        timestamp: new Date(),
      },
    ]);
    setGameOver(false);
    setUserInput('');

    if (resetTimerFlag) {
      setTimeLeft(ROUND_DURATION_SECONDS);
      // When timer is fully reset, timeLeft change will trigger useEffect. No need to bump timerVersion.
    } else {
      // This is for "Next Question" or "Skip Question" where timer continues.
      // If timeLeft is > 0 and gameOver became false (or was already false),
      // we need to ensure the timer restarts. Bumping timerVersion will re-run the useEffect.
      if (timeLeft > 0) {
        setTimerVersion(v => v + 1);
      }
      // If timeLeft <=0, the main timer useEffect will handle setting gameOver.
    }

    setIsTimeUpDialogOpen(false);
    if (resetScoreFlag) {
      setScore(0);
    }
  };

  const handleNextQuestion = () => {
    // Preserves score, preserves timeLeft, starts new condition
    initializeGame(false, false);
  };


  useEffect(() => {
    initializeGame(true, true); // Full reset on initial load
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Initialize on first load

  // Timer effect
  useEffect(() => {
    const effectClearTimer = () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };

    if (gameOver) {
      effectClearTimer();
      return;
    }

    if (timeLeft <= 0) {
      effectClearTimer();
      if (!gameOver) { 
        setGameOver(true);
        setIsTimeUpDialogOpen(true);
      }
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return effectClearTimer;
  }, [timeLeft, gameOver, timerVersion]); // Added timerVersion to dependencies

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
        modelName: selectedModel,
      });
      addMessage(response.patientResponse, 'ai');
    } catch (error) {
      console.error('Error generating patient response:', error);
      addMessage('抱歉，我遇到一個錯誤。請再試一次。', 'system', false, true);
      toast({
        title: '錯誤',
        description: '無法從 AI 病患獲取回應。',
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
    const messagesBeforeThisDiagnosisAttempt = [...messages]; 

    addMessage(`我的診斷： ${diagnosisAttempt}`, 'user');
    setUserInput('');
    setIsLoadingFeedback(true);

    try {
      const relevantHistoryForClues = messagesBeforeThisDiagnosisAttempt.filter(
        msg => !(msg.sender === 'user' && msg.text.startsWith('我的診斷：'))
      );
      const clues = formatChatHistory(relevantHistoryForClues);
      
      const feedbackResponse = await provideDiagnosisFeedback({
        diagnosisAttempt,
        correctDiagnosis: currentCondition,
        patientClues: clues,
        modelName: selectedModel,
      });

      addMessage(feedbackResponse.feedback, 'system', true);

      if (feedbackResponse.isCorrect) {
        clearTimer(); 
        const newScore = score + 1;
        setScore(newScore);
        setGameOver(true); 
        addMessage(
          `恭喜！您已正確診斷出「${currentCondition}」。您的總得分是：${newScore}。`,
          'system',
          true
        );
        toast({
          title: '診斷正確！',
          description: `您已成功診斷出「${currentCondition}」。總得分：${newScore}。`,
        });
      }
    } catch (error) {
      console.error('Error providing diagnosis feedback:', error);
      addMessage('抱歉，處理您的診斷時發生錯誤。請再試一次。', 'system', false, true);
      toast({
        title: '錯誤',
        description: '無法處理您的診斷。',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingFeedback(false);
    }
  };

  const handleSkipQuestion = () => {
    if (isLoadingAI || isLoadingFeedback || gameOver) return;
    addMessage('使用者選擇跳過此題。正在準備新的病例...', 'system');
    // Preserves score, preserves timeLeft, starts new condition
    initializeGame(false, false); 
  };
  
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <AppHeader />
      <main className="flex-grow container mx-auto py-6 flex justify-center items-start">
        <Card className="w-full max-w-2xl shadow-xl flex flex-col h-[calc(100vh-150px)]">
          <CardHeader className="border-b flex flex-row justify-between items-center p-4 space-x-4">
            <CardTitle className="text-xl text-foreground/80">AI 病患聊天室</CardTitle>
            <div className="flex items-center text-base sm:text-lg font-semibold text-accent whitespace-nowrap">
              <Clock className="h-5 w-5 mr-1 sm:mr-2 flex-shrink-0" />
              時間：{formatTime(timeLeft)}
            </div>
            <div className="flex items-center text-base sm:text-lg font-semibold text-primary whitespace-nowrap">
              <Trophy className="h-5 w-5 mr-1 sm:mr-2 flex-shrink-0" />
              得分：{score}
            </div>
          </CardHeader>
          <CardContent className="flex-grow p-0 overflow-hidden">
            <ScrollArea className="h-full p-4" ref={scrollAreaRef}>
              {messages.map(msg => (
                <ChatMessageItem key={msg.id} message={msg} />
              ))}
              {(isLoadingAI || isLoadingFeedback) && (
                <div className="flex justify-start items-center p-2">
                  <Loader2 className="h-5 w-5 text-muted-foreground animate-spin mr-2" />
                  <span className="text-sm text-muted-foreground">AI ({selectedModel.startsWith('ollama') ? 'Ollama' : 'Google AI'}) 正在思考...</span>
                </div>
              )}
            </ScrollArea>
          </CardContent>
          <CardFooter className="p-4 border-t">
            {gameOver && !isTimeUpDialogOpen ? ( // Correct guess scenario
              <Button onClick={handleNextQuestion} className="w-full" variant="default">
                <Play className="mr-2 h-4 w-4" /> 下一題
              </Button>
            ) : gameOver && isTimeUpDialogOpen ? ( // Time is up scenario
                 <div className="w-full text-center text-muted-foreground">
                   時間到！請點擊「重新開始」以開始新遊戲。
                 </div>
            ) : ( // Normal gameplay, form is active
              <form onSubmit={handleSendMessage} className="w-full flex gap-2">
                <Input
                  type="text"
                  placeholder="輸入您的訊息或診斷..."
                  value={userInput}
                  onChange={e => setUserInput(e.target.value)}
                  disabled={isLoadingAI || isLoadingFeedback || gameOver}
                  className="flex-grow"
                />
                <Button
                  type="submit"
                  disabled={isLoadingAI || isLoadingFeedback || !userInput.trim() || gameOver}
                  variant="default"
                  aria-label="傳送訊息"
                >
                  {isLoadingAI ? <Loader2 className="animate-spin" /> : <SendHorizonal />}
                  <span className="ml-2 hidden sm:inline">傳送</span>
                </Button>
                <Button
                  type="button"
                  onClick={handleSubmitDiagnosis}
                  disabled={isLoadingAI || isLoadingFeedback || !userInput.trim() || gameOver}
                  variant="outline"
                  aria-label="提交診斷"
                  className="border-accent text-accent hover:bg-accent/10 hover:text-accent"
                >
                  {isLoadingFeedback ? <Loader2 className="animate-spin" /> : <Lightbulb />}
                   <span className="ml-2 hidden sm:inline">診斷</span>
                </Button>
                <Button
                  type="button"
                  onClick={handleSkipQuestion}
                  disabled={isLoadingAI || isLoadingFeedback || gameOver}
                  variant="secondary"
                  aria-label="跳過此題"
                >
                  <SkipForward className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">跳過</span>
                </Button>
              </form>
            )}
          </CardFooter>
        </Card>
      </main>
      <AlertDialog open={isTimeUpDialogOpen} onOpenChange={(open) => {
          setIsTimeUpDialogOpen(open);
          // Only auto-restart if dialog is closed AND it was a time-up game over.
          // This prevents restarting if user closes dialog before time is officially up (e.g. by ESC key).
          if (!open && gameOver && timeLeft <= 0) { 
            initializeGame(true, true); // Full reset: score and timer
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>時間到！</AlertDialogTitle>
            <AlertDialogDescription>
              很遺憾，本回合時間已到。您目前的總得分是：{score}。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button onClick={() => {
              setIsTimeUpDialogOpen(false);
              initializeGame(true, true); // Full reset: score and timer
            }}>
              <RotateCcw className="mr-2 h-4 w-4" /> 重新開始
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ChatPage;
