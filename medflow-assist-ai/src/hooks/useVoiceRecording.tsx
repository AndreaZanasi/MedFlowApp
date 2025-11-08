import { useState, useRef, useCallback } from "react";
import { toast } from "sonner";

export const useVoiceRecording = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  
  const recognitionRef = useRef<any>(null);
  const interimTranscriptRef = useRef("");

  const startRecording = useCallback(async () => {
    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });

      // Check for browser support
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        setError("Speech recognition is not supported in this browser. Please use Chrome or Edge.");
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        console.log("Voice recognition started");
        setIsRecording(true);
      };

      recognition.onresult = (event: any) => {
        let interimTranscript = "";
        let finalTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + " ";
          } else {
            interimTranscript += transcript;
          }
        }

        if (finalTranscript) {
          setTranscript(prev => prev + finalTranscript);
        }

        interimTranscriptRef.current = interimTranscript;
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        
        if (event.error === "not-allowed") {
          setError("Microphone access denied. Please allow microphone access.");
        } else if (event.error === "no-speech") {
          console.log("No speech detected, continuing...");
        } else {
          setError(`Recording error: ${event.error}`);
        }
      };

      recognition.onend = () => {
        console.log("Voice recognition ended");
        if (isRecording) {
          // Restart if still supposed to be recording
          recognition.start();
        }
      };

      recognitionRef.current = recognition;
      recognition.start();

    } catch (error) {
      console.error("Error starting recording:", error);
      setError("Failed to start recording. Please check microphone permissions.");
    }
  }, [isRecording]);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      setIsRecording(false);
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
  }, []);

  const getCurrentTranscript = useCallback(() => {
    return transcript + interimTranscriptRef.current;
  }, [transcript]);

  return {
    isRecording,
    isListening: isRecording,
    transcript,
    startRecording,
    stopRecording,
    getCurrentTranscript,
    error,
  };
};
