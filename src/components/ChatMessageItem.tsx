'use client';

import type { FC } from 'react';
import { Bot, User, AlertTriangle, Info } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { Message } from '@/types';

interface ChatMessageItemProps {
  message: Message;
}

const ChatMessageItem: FC<ChatMessageItemProps> = ({ message }) => {
  const isUser = message.sender === 'user';
  const isSystem = message.sender === 'system';
  const isAI = message.sender === 'ai';

  const avatarIcon = isUser ? (
    <User className="h-6 w-6" />
  ) : isAI ? (
    <Bot className="h-6 w-6" />
  ) : message.isError ? (
    <AlertTriangle className="h-6 w-6" />
  ) : (
    <Info className="h-6 w-6" />
  );
  
  const avatarBgColor = isUser ? 'bg-accent' : isAI ? 'bg-primary' : 'bg-secondary';
  const avatarFgColor = isUser ? 'text-accent-foreground' : isAI ? 'text-primary-foreground' : 'text-secondary-foreground';

  return (
    <div
      className={cn(
        'flex items-end gap-2 my-3',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      {!isUser && (
        <Avatar className={cn('h-10 w-10', avatarBgColor)}>
          <AvatarFallback className={cn(avatarBgColor, avatarFgColor)}>
            {avatarIcon}
          </AvatarFallback>
        </Avatar>
      )}
      <Card
        className={cn(
          'max-w-[75%] rounded-xl shadow-md',
          isUser ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-card text-card-foreground rounded-bl-none',
          isSystem && message.isFeedback && 'bg-teal-100 dark:bg-teal-800 text-teal-800 dark:text-teal-100 border-teal-500',
          isSystem && message.isError && 'bg-destructive/20 text-destructive border-destructive'
        )}
      >
        <CardContent className="p-3">
          <p className="text-sm whitespace-pre-wrap">{message.text}</p>
          <p className={cn(
            "text-xs mt-1",
            isUser ? "text-primary-foreground/70 text-right" : "text-muted-foreground text-left"
          )}>
            {message.timestamp.toLocaleTimeString()}
          </p>
        </CardContent>
      </Card>
      {isUser && (
         <Avatar className={cn('h-10 w-10', avatarBgColor)}>
           <AvatarFallback className={cn(avatarBgColor, avatarFgColor)}>
            {avatarIcon}
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
};

export default ChatMessageItem;
