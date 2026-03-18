"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { cn, formatTime } from "@/lib/utils";
import { generateQuestion } from "@/lib/question-generator";
import {
  Difficulty,
  Operation,
  NumberType,
  Question,
  QuestionResult,
  TEST_PRESETS,
} from "@/lib/types";
import { Pause, Play, SkipForward } from "lucide-react";

function SessionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);

  // Parse config from URL
  const mode = searchParams.get("mode") as "practice" | "test";
  const isPractice = mode === "practice";
  
  // Practice config
  const difficulty = (searchParams.get("difficulty") || "L1") as Difficulty;
  const sessionType = searchParams.get("sessionType") || "finite";
  const questionCountParam = parseInt(searchParams.get("questionCount") || "20");
  const timerParam = searchParams.get("timer");
  const operationsParam = searchParams.get("operations");
  const numberTypesParam = searchParams.get("numberTypes");
  
  // Test config
  const presetId = searchParams.get("preset");
  const preset = TEST_PRESETS.find((p) => p.id === presetId);

  // Derived config
  const operations = operationsParam
    ? (operationsParam.split(",") as Operation[])
    : (["addition", "subtraction", "multiplication", "division"] as Operation[]);
  const numberTypes = numberTypesParam
    ? (numberTypesParam.split(",") as NumberType[])
    : (["integer"] as NumberType[]);
  
  const totalQuestions = isPractice
    ? sessionType === "open-ended"
      ? Infinity
      : questionCountParam
    : preset?.questionCount || 80;
    
  const initialTime = isPractice
    ? timerParam
      ? parseInt(timerParam)
      : null
    : preset?.timeLimit || 480;

  // Session state
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [userAnswer, setUserAnswer] = useState("");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [results, setResults] = useState<QuestionResult[]>([]);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [sessionStartTime] = useState(Date.now());
  const [timeRemaining, setTimeRemaining] = useState<number | null>(initialTime);
  const [isPaused, setIsPaused] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  // Generate first question
  useEffect(() => {
    const question = generateQuestion({
      difficulty,
      operations,
      numberTypes,
    });
    setCurrentQuestion(question);
    setQuestionStartTime(Date.now());
  }, []);

  // Timer countdown
  useEffect(() => {
    if (timeRemaining === null || isPaused || isComplete) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null || prev <= 0) {
          clearInterval(interval);
          handleTimeExpired();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeRemaining, isPaused, isComplete]);

  // Focus input on mount and after each question
  useEffect(() => {
    if (!isPaused && !isComplete) {
      inputRef.current?.focus();
    }
  }, [currentQuestion, isPaused, isComplete]);

  const handleTimeExpired = useCallback(() => {
    // Mark current question as skipped if unanswered
    if (currentQuestion && userAnswer === "") {
      const result: QuestionResult = {
        question: currentQuestion,
        userAnswer: null,
        isCorrect: false,
        isSkipped: true,
        responseTime: Date.now() - questionStartTime,
      };
      const finalResults = [...results, result];
      completeSession(finalResults);
    } else {
      completeSession(results);
    }
  }, [currentQuestion, userAnswer, questionStartTime, results]);

  const completeSession = (finalResults: QuestionResult[]) => {
    setIsComplete(true);
    
    // Calculate stats
    const correctCount = finalResults.filter((r) => r.isCorrect).length;
    const wrongCount = finalResults.filter((r) => !r.isCorrect && !r.isSkipped).length;
    const skippedCount = finalResults.filter((r) => r.isSkipped).length;
    const score = isPractice
      ? correctCount
      : correctCount - wrongCount;
    const accuracy = finalResults.length > 0
      ? Math.round((correctCount / finalResults.length) * 100)
      : 0;
    const totalTime = Date.now() - sessionStartTime;
    const avgResponseTime = finalResults.length > 0
      ? Math.round(
          finalResults.reduce((acc, r) => acc + r.responseTime, 0) /
            finalResults.length
        )
      : 0;

    // Store results and navigate
    const sessionResult = {
      mode,
      difficulty,
      preset: preset?.name,
      results: finalResults,
      score,
      accuracy,
      totalTime,
      avgResponseTime,
      correctCount,
      wrongCount,
      skippedCount,
      questionCount: finalResults.length,
    };
    
    sessionStorage.setItem("lastSessionResult", JSON.stringify(sessionResult));
    router.push("/mental-math/results");
  };

  const submitAnswer = useCallback(() => {
    if (!currentQuestion || userAnswer.trim() === "") return;

    const responseTime = Date.now() - questionStartTime;
    const normalizedUserAnswer = userAnswer.trim().replace(/\s/g, "");
    const normalizedCorrectAnswer = String(currentQuestion.answer).replace(/\s/g, "");
    
    const isCorrect = normalizedUserAnswer === normalizedCorrectAnswer;

    const result: QuestionResult = {
      question: currentQuestion,
      userAnswer: userAnswer.trim(),
      isCorrect,
      isSkipped: false,
      responseTime,
    };

    const newResults = [...results, result];
    setResults(newResults);
    setUserAnswer("");

    // Check if session is complete
    if (questionIndex + 1 >= totalQuestions) {
      completeSession(newResults);
      return;
    }

    // Generate next question
    const nextQuestion = generateQuestion({
      difficulty,
      operations,
      numberTypes,
    });
    setCurrentQuestion(nextQuestion);
    setQuestionIndex((prev) => prev + 1);
    setQuestionStartTime(Date.now());
  }, [currentQuestion, userAnswer, questionStartTime, results, questionIndex, totalQuestions]);

  const skipQuestion = useCallback(() => {
    if (!currentQuestion) return;

    const responseTime = Date.now() - questionStartTime;

    const result: QuestionResult = {
      question: currentQuestion,
      userAnswer: null,
      isCorrect: false,
      isSkipped: true,
      responseTime,
    };

    const newResults = [...results, result];
    setResults(newResults);
    setUserAnswer("");

    // Check if session is complete
    if (questionIndex + 1 >= totalQuestions) {
      completeSession(newResults);
      return;
    }

    // Generate next question
    const nextQuestion = generateQuestion({
      difficulty,
      operations,
      numberTypes,
    });
    setCurrentQuestion(nextQuestion);
    setQuestionIndex((prev) => prev + 1);
    setQuestionStartTime(Date.now());
  }, [currentQuestion, questionStartTime, results, questionIndex, totalQuestions]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      submitAnswer();
    } else if (e.key === "Tab") {
      e.preventDefault();
      skipQuestion();
    } else if (e.key === " " && isPractice && !userAnswer) {
      e.preventDefault();
      setIsPaused(!isPaused);
    }
  };

  if (isComplete) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-foreground-muted">Calculating results...</p>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      {/* Pause Overlay */}
      {isPaused && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/95">
          <div className="text-center">
            <p className="mb-4 text-foreground-muted">Paused</p>
            <button
              onClick={() => setIsPaused(false)}
              className="flex items-center gap-2 rounded-lg border border-border bg-background-card px-6 py-3 text-foreground transition-colors hover:bg-background-hover"
            >
              <Play className="h-4 w-4" />
              Resume
            </button>
          </div>
        </div>
      )}

      {/* Main Exercise Area */}
      <main className="flex flex-1 items-center justify-center px-6">
        <div className="flex w-full max-w-4xl items-center justify-center gap-4 md:gap-8">
          {/* Question */}
          <div className="flex-1 text-right">
            <span className="font-mono text-5xl font-bold tracking-tight text-foreground-bright sm:text-6xl md:text-7xl lg:text-8xl">
              {currentQuestion?.prompt}
            </span>
          </div>

          {/* Equals Sign */}
          <span className="font-mono text-4xl text-foreground-muted sm:text-5xl md:text-6xl lg:text-7xl">
            =
          </span>

          {/* Answer Input */}
          <div className="flex-1">
            <input
              ref={inputRef}
              type="text"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full bg-transparent font-mono text-5xl font-bold tracking-tight text-foreground-bright outline-none placeholder:text-foreground-muted/30 sm:text-6xl md:text-7xl lg:text-8xl"
              placeholder="?"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              disabled={isPaused}
            />
          </div>
        </div>
      </main>

      {/* Bottom HUD */}
      <footer className="border-t border-border-subtle bg-background-elevated px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          {/* Left: Progress */}
          <div className="flex items-center gap-6">
            <div className="flex flex-col">
              <span className="text-xs uppercase tracking-wider text-foreground-muted">
                Progress
              </span>
              <span className="font-mono text-sm text-foreground">
                {questionIndex + 1}
                {totalQuestions !== Infinity && ` / ${totalQuestions}`}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs uppercase tracking-wider text-foreground-muted">
                Mode
              </span>
              <span className="text-sm text-foreground">
                {isPractice ? "Practice" : preset?.name || "Test"}
              </span>
            </div>
          </div>

          {/* Center: Timer */}
          {timeRemaining !== null && (
            <div className="flex flex-col items-center">
              <span className="text-xs uppercase tracking-wider text-foreground-muted">
                Time
              </span>
              <span
                className={cn(
                  "font-mono text-lg",
                  timeRemaining <= 30
                    ? "text-error"
                    : timeRemaining <= 60
                    ? "text-warning"
                    : "text-foreground-bright"
                )}
              >
                {formatTime(timeRemaining)}
              </span>
            </div>
          )}

          {/* Right: Controls */}
          <div className="flex items-center gap-3">
            {isPractice && (
              <button
                onClick={() => setIsPaused(!isPaused)}
                className="flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm text-foreground-muted transition-colors hover:border-foreground-muted hover:text-foreground"
              >
                {isPaused ? (
                  <Play className="h-3.5 w-3.5" />
                ) : (
                  <Pause className="h-3.5 w-3.5" />
                )}
                <span className="hidden sm:inline">
                  {isPaused ? "Resume" : "Pause"}
                </span>
              </button>
            )}
            <button
              onClick={skipQuestion}
              className="flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm text-foreground-muted transition-colors hover:border-foreground-muted hover:text-foreground"
            >
              <SkipForward className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Skip</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Keyboard hints */}
      <div className="absolute bottom-20 left-1/2 hidden -translate-x-1/2 items-center gap-4 text-xs text-foreground-muted/50 md:flex">
        <span>
          <kbd className="rounded bg-background-card px-1.5 py-0.5 font-mono">
            Enter
          </kbd>{" "}
          Submit
        </span>
        <span>
          <kbd className="rounded bg-background-card px-1.5 py-0.5 font-mono">
            Tab
          </kbd>{" "}
          Skip
        </span>
        {isPractice && (
          <span>
            <kbd className="rounded bg-background-card px-1.5 py-0.5 font-mono">
              Space
            </kbd>{" "}
            Pause
          </span>
        )}
      </div>
    </div>
  );
}

export default function SessionPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <p className="text-foreground-muted">Loading session...</p>
        </div>
      }
    >
      <SessionContent />
    </Suspense>
  );
}
