/**
 * AI Chat Widget Component
 * Task: 1.4.1.3 - Chatbot UI
 */

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Input,
  ScrollShadow,
  Avatar,
  Spinner,
} from "@heroui/react";
import {
  MessageCircle,
  X,
  Send,
  Minimize2,
  Maximize2,
  Trash2,
  Bot,
  User,
} from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
}

// Generate unique session ID
function generateSessionId(): string {
  return `chat-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("chat-session-id");
      if (stored) return stored;
      const newId = generateSessionId();
      sessionStorage.setItem("chat-session-id", newId);
      return newId;
    }
    return generateSessionId();
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus();
    }
  }, [isOpen, isMinimized]);

  // Initialize session when chat opens
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Add welcome message
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content:
            "Hello! I'm ARL Assistant. I can help you find information about the company, contacts, safety guidelines, and more. How can I assist you today?",
          createdAt: new Date(),
        },
      ]);

      // Initialize session on server
      const formData = new FormData();
      formData.append("intent", "init");
      formData.append("sessionId", sessionId);
      fetch("/api/chat", { method: "POST", body: formData });
    }
  }, [isOpen, sessionId, messages.length]);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: input.trim(),
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("intent", "message");
      formData.append("sessionId", sessionId);
      formData.append("message", userMessage.content);

      const response = await fetch("/api/chat", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.error && !data.response) {
        setMessages((prev) => [
          ...prev,
          {
            id: `error-${Date.now()}`,
            role: "assistant",
            content: data.error,
            createdAt: new Date(),
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            content: data.response,
            createdAt: new Date(),
          },
        ]);
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
          createdAt: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, sessionId]);

  const clearChat = async () => {
    const formData = new FormData();
    formData.append("intent", "clear");
    formData.append("sessionId", sessionId);
    await fetch("/api/chat", { method: "POST", body: formData });

    setMessages([
      {
        id: "welcome-new",
        role: "assistant",
        content: "Chat cleared. How can I help you?",
        createdAt: new Date(),
      },
    ]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Quick action suggestions
  const suggestions = [
    "Emergency contacts",
    "IT Help Desk",
    "Canteen hours",
    "How do I apply for leave?",
  ];

  if (!isOpen) {
    return (
      <Button
        isIconOnly
        color="primary"
        size="lg"
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg"
        onPress={() => setIsOpen(true)}
        aria-label="Open chat"
      >
        <MessageCircle size={24} />
      </Button>
    );
  }

  return (
    <Card
      className={`fixed z-50 shadow-2xl transition-all duration-200 ${
        isMinimized
          ? "bottom-6 right-6 w-72"
          : "bottom-6 right-6 w-96 max-w-[calc(100vw-2rem)]"
      }`}
    >
      {/* Header */}
      <CardHeader className="flex justify-between items-center bg-primary-600 text-white rounded-t-lg px-4 py-3">
        <div className="flex items-center gap-2">
          <Bot size={20} />
          <span className="font-semibold">ARL Assistant</span>
        </div>
        <div className="flex items-center gap-1">
          {!isMinimized && (
            <Button
              isIconOnly
              size="sm"
              variant="light"
              className="text-white"
              onPress={clearChat}
              aria-label="Clear chat"
            >
              <Trash2 size={16} />
            </Button>
          )}
          <Button
            isIconOnly
            size="sm"
            variant="light"
            className="text-white"
            onPress={() => setIsMinimized(!isMinimized)}
            aria-label={isMinimized ? "Maximize" : "Minimize"}
          >
            {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
          </Button>
          <Button
            isIconOnly
            size="sm"
            variant="light"
            className="text-white"
            onPress={() => setIsOpen(false)}
            aria-label="Close chat"
          >
            <X size={16} />
          </Button>
        </div>
      </CardHeader>

      {!isMinimized && (
        <CardBody className="p-0">
          {/* Messages */}
          <ScrollShadow className="h-80 p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-2 ${
                    message.role === "user" ? "flex-row-reverse" : ""
                  }`}
                >
                  <Avatar
                    size="sm"
                    icon={
                      message.role === "user" ? (
                        <User size={16} />
                      ) : (
                        <Bot size={16} />
                      )
                    }
                    classNames={{
                      base:
                        message.role === "user"
                          ? "bg-primary-100"
                          : "bg-gray-100",
                      icon:
                        message.role === "user"
                          ? "text-primary-600"
                          : "text-gray-600",
                    }}
                  />
                  <div
                    className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                      message.role === "user"
                        ? "bg-primary-500 text-white"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-2">
                  <Avatar
                    size="sm"
                    icon={<Bot size={16} />}
                    classNames={{
                      base: "bg-gray-100",
                      icon: "text-gray-600",
                    }}
                  />
                  <div className="bg-gray-100 rounded-lg px-4 py-3">
                    <Spinner size="sm" />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </ScrollShadow>

          {/* Suggestions (only show initially) */}
          {messages.length === 1 && (
            <div className="px-4 pb-2">
              <p className="text-xs text-gray-500 mb-2">Try asking:</p>
              <div className="flex flex-wrap gap-1">
                {suggestions.map((suggestion) => (
                  <Button
                    key={suggestion}
                    size="sm"
                    variant="flat"
                    className="text-xs h-7"
                    onPress={() => {
                      setInput(suggestion);
                      inputRef.current?.focus();
                    }}
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={input}
                onValueChange={setInput}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
                size="sm"
                isDisabled={isLoading}
                classNames={{
                  inputWrapper: "bg-gray-100",
                }}
              />
              <Button
                isIconOnly
                color="primary"
                size="sm"
                onPress={sendMessage}
                isDisabled={!input.trim() || isLoading}
              >
                <Send size={16} />
              </Button>
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center">
              ARL Knowledge Base Assistant
            </p>
          </div>
        </CardBody>
      )}
    </Card>
  );
}
