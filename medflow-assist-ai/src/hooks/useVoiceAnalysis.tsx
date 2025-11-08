import { useRef, useCallback } from 'react';

interface VoiceAnalysisResult {
  isLowPitch: boolean;
  confidence: number;
}

export const useVoiceAnalysis = () => {
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const setupAnalyzer = useCallback((stream: MediaStream) => {
    audioContextRef.current = new AudioContext();
    const source = audioContextRef.current.createMediaStreamSource(stream);
    analyzerRef.current = audioContextRef.current.createAnalyser();
    analyzerRef.current.fftSize = 2048;
    source.connect(analyzerRef.current);
  }, []);

  const analyzePitch = useCallback((): VoiceAnalysisResult => {
    if (!analyzerRef.current) {
      return { isLowPitch: false, confidence: 0 };
    }

    const bufferLength = analyzerRef.current.fftSize;
    const dataArray = new Float32Array(bufferLength);
    analyzerRef.current.getFloatTimeDomainData(dataArray);

    // Autocorrelation to find pitch
    let maxCorrelation = 0;
    let fundamentalFrequency = 0;
    
    for (let lag = 1; lag < bufferLength / 2; lag++) {
      let correlation = 0;
      for (let i = 0; i < bufferLength / 2; i++) {
        correlation += dataArray[i] * dataArray[i + lag];
      }
      if (correlation > maxCorrelation) {
        maxCorrelation = correlation;
        fundamentalFrequency = audioContextRef.current!.sampleRate / lag;
      }
    }

    // Typically:
    // Male voices: 85-180 Hz
    // Female voices: 165-255 Hz
    // Children: 250-300 Hz
    const isLowPitch = fundamentalFrequency > 0 && fundamentalFrequency < 165;
    const confidence = Math.min(maxCorrelation / 100, 1);

    return { isLowPitch, confidence };
  }, []);

  const cleanup = useCallback(() => {
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    analyzerRef.current = null;
  }, []);

  return { setupAnalyzer, analyzePitch, cleanup };
};
