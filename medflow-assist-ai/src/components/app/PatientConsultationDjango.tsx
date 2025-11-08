/**
 * Simplified Patient Consultation Component
 * Integrates with Django backend for transcription and AI processing
 */
import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  Mic, 
  Square, 
  User,
  Loader2,
  FileText,
  Save,
  AlertCircle,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { apiService } from "@/services/api";

const PatientConsultationDjango = () => {
  const [patientName, setPatientName] = useState("");
  const [currentPatient, setCurrentPatient] = useState<any | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [processedData, setProcessedData] = useState<any>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadMode, setUploadMode] = useState<'record' | 'upload'>('record');
  
  // Web Audio API for recording
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleStartConsultation = () => {
    if (!patientName.trim()) {
      toast.error("Please enter patient name");
      return;
    }

    const newMRN = `${patientName.substring(0, 3).toUpperCase()}-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, "0")}`;
    setCurrentPatient({
      name: patientName.trim(),
      mrn: newMRN,
    });
    toast.success(`Consultation started for ${patientName}`);
  };

  const handleStartRecording = async () => {
    if (!currentPatient) {
      toast.error("Please start a consultation first");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm',
      });
      
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await transcribeAudio(audioBlob);
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      toast.success("Recording started");
    } catch (error) {
      console.error("Error starting recording:", error);
      toast.error("Failed to start recording. Please check microphone permissions.");
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      // Stop all tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      toast.info("Processing audio...");
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    setIsProcessing(true);
    try {
      // Convert blob to file
      const audioFile = new File([audioBlob], 'recording.webm', { type: 'audio/webm' });
      
      // Send to Django backend for transcription
      const response = await apiService.transcribeAudio(audioFile);
      
      if (response.success) {
        setTranscript(response.transcription);
        toast.success("Transcription complete!");
        
        // Automatically process through AI agents
        await processTranscription(response.transcription, response.audio_file);
      }
    } catch (error: any) {
      console.error("Transcription error:", error);
      toast.error(error.message || "Transcription failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check if it's an audio file
      if (!file.type.startsWith('audio/')) {
        toast.error('Please select an audio file');
        return;
      }
      setSelectedFile(file);
      toast.success(`Selected: ${file.name}`);
    }
  };

  const handleUploadAudio = async () => {
    if (!selectedFile || !currentPatient) {
      toast.error('Please select a file and start consultation first');
      return;
    }

    setIsProcessing(true);
    try {
      console.log('Uploading file:', selectedFile.name, selectedFile.type, selectedFile.size);
      const response = await apiService.transcribeAudio(selectedFile);
      
      console.log('Transcription response:', response);
      
      if (response.success) {
        setTranscript(response.transcription);
        toast.success("Transcription complete!");
        
        // Automatically process through AI agents
        await processTranscription(response.transcription, response.audio_file);
        
        // Clear selected file
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(`Upload failed: ${error.message || error.toString()}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const processTranscription = async (transcriptionText: string, audioFile?: string) => {
    setIsProcessing(true);
    try {
      const response = await apiService.processTranscription(transcriptionText, audioFile);
      
      if (response.success) {
        setProcessedData(response);
        
        // Extract patient name from response for better feedback
        const patientName = response.patient_data?.patient_name || "Patient";
        
        toast.success(
          `Medical data processed successfully for ${patientName}!`,
          {
            description: "Patient visit has been saved to records."
          }
        );
      }
    } catch (error: any) {
      console.error("Processing error:", error);
      toast.error(error.message || "Failed to process transcription");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveNotes = () => {
    if (!processedData || !currentPatient) {
      toast.error("No data to save");
      return;
    }

    const note = {
      id: Date.now().toString(),
      patientName: currentPatient.name,
      patientMRN: currentPatient.mrn,
      date: new Date().toISOString(),
      transcription: transcript,
      ...processedData,
    };

    const storedNotes = JSON.parse(localStorage.getItem("clinicalNotes") || "[]");
    storedNotes.push(note);
    localStorage.setItem("clinicalNotes", JSON.stringify(storedNotes));
    
    toast.success("Clinical notes saved!");
    
    // Reset for next consultation
    setCurrentPatient(null);
    setPatientName("");
    setTranscript("");
    setProcessedData(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Patient Consultation</h1>
      </div>

      {/* Patient Information */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-xl font-semibold">Patient Information</h2>
          </div>
          
          {!currentPatient ? (
            <div className="flex gap-3">
              <Input
                placeholder="Enter patient name"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleStartConsultation()}
                className="flex-1"
              />
              <Button onClick={handleStartConsultation}>
                Start Consultation
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <p className="font-semibold text-lg">{currentPatient.name}</p>
                  <p className="text-sm text-muted-foreground">MRN: {currentPatient.mrn}</p>
                </div>
                <Badge variant="default">Active</Badge>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Recording Controls */}
      {currentPatient && (
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mic className="w-5 h-5 text-muted-foreground" />
                <h2 className="text-xl font-semibold">Audio Input</h2>
              </div>
              
              {/* Toggle between Record and Upload */}
              <div className="flex gap-2">
                <Button
                  variant={uploadMode === 'record' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setUploadMode('record')}
                  disabled={isProcessing || isRecording}
                >
                  <Mic className="w-4 h-4 mr-2" />
                  Record
                </Button>
                <Button
                  variant={uploadMode === 'upload' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setUploadMode('upload')}
                  disabled={isProcessing || isRecording}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload
                </Button>
              </div>
            </div>

            {/* Record Mode */}
            {uploadMode === 'record' && (
              <>
                <div className="flex gap-3">
                  {!isRecording ? (
                    <Button
                      onClick={handleStartRecording}
                      className="flex-1"
                      size="lg"
                      disabled={isProcessing}
                    >
                      <Mic className="w-4 h-4 mr-2" />
                      Start Recording
                    </Button>
                  ) : (
                    <Button
                      onClick={handleStopRecording}
                      variant="destructive"
                      className="flex-1"
                      size="lg"
                    >
                      <Square className="w-4 h-4 mr-2" />
                      Stop Recording
                    </Button>
                  )}
                </div>

                {isRecording && (
                  <div className="flex items-center justify-center gap-2 p-4 bg-red-50 dark:bg-red-950 rounded-lg">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                    <span className="text-sm font-medium text-red-600 dark:text-red-400">
                      Recording in progress...
                    </span>
                  </div>
                )}
              </>
            )}

            {/* Upload Mode */}
            {uploadMode === 'upload' && (
              <>
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="audio/*,.m4a,.mp3,.wav,.webm,.ogg,.flac"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="audio-file-input"
                    />
                    <label
                      htmlFor="audio-file-input"
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-muted-foreground/25 rounded-lg cursor-pointer hover:border-primary hover:bg-muted/50 transition-colors"
                    >
                      <Upload className="w-5 h-5 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        {selectedFile ? selectedFile.name : 'Click to select audio file'}
                      </span>
                    </label>
                    {selectedFile && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedFile(null);
                          if (fileInputRef.current) {
                            fileInputRef.current.value = '';
                          }
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  {selectedFile && (
                    <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{selectedFile.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                  )}

                  <Button
                    onClick={handleUploadAudio}
                    className="w-full"
                    size="lg"
                    disabled={!selectedFile || isProcessing}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload & Transcribe
                  </Button>
                </div>

                <div className="text-xs text-muted-foreground text-center">
                  Supported formats: MP3, M4A, WAV, WebM, OGG, FLAC
                </div>
              </>
            )}

            {isProcessing && (
              <div className="flex items-center justify-center gap-2 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                  Processing audio through AI agents...
                </span>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Transcription */}
      {transcript && (
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-muted-foreground" />
              <h2 className="text-xl font-semibold">Transcription</h2>
            </div>
            <ScrollArea className="h-[200px] w-full rounded-md border p-4">
              <p className="text-sm whitespace-pre-wrap">{transcript}</p>
            </ScrollArea>
          </div>
        </Card>
      )}

      {/* Processed Medical Data */}
      {processedData && (
        <>
          {/* SOAP Note */}
          {processedData.soap_note && (
            <Card className="p-6">
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">SOAP Note</h2>
                <div className="space-y-3">
                  {processedData.soap_note.subjective && (
                    <div>
                      <h3 className="font-semibold text-sm text-muted-foreground">Subjective</h3>
                      <p className="text-sm mt-1">{processedData.soap_note.subjective}</p>
                    </div>
                  )}
                  {processedData.soap_note.objective && (
                    <div>
                      <h3 className="font-semibold text-sm text-muted-foreground">Objective</h3>
                      <p className="text-sm mt-1">{processedData.soap_note.objective}</p>
                    </div>
                  )}
                  {processedData.soap_note.assessment && (
                    <div>
                      <h3 className="font-semibold text-sm text-muted-foreground">Assessment</h3>
                      <p className="text-sm mt-1">{processedData.soap_note.assessment}</p>
                    </div>
                  )}
                  {processedData.soap_note.plan && (
                    <div>
                      <h3 className="font-semibold text-sm text-muted-foreground">Plan</h3>
                      <p className="text-sm mt-1">{processedData.soap_note.plan}</p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )}

          {/* Tasks */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Lab Requisition */}
            {processedData.lab_requisition && processedData.lab_requisition.request_type !== 'none' && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Lab Orders</h2>
                <div className="space-y-2">
                  {processedData.lab_requisition.tests_ordered?.map((test: string, idx: number) => (
                    <div key={idx} className="p-2 bg-muted rounded">
                      <p className="text-sm">{test}</p>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Pharmacy Requisition */}
            {processedData.pharmacy_requisition && processedData.pharmacy_requisition.requisition_type !== 'none' && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Prescriptions</h2>
                <div className="space-y-2">
                  {processedData.pharmacy_requisition.prescription_details?.prescriptions?.map((med: any, idx: number) => (
                    <div key={idx} className="p-3 bg-muted rounded">
                      <p className="font-medium text-sm">{med.medication_name}</p>
                      <p className="text-xs text-muted-foreground">{med.strength} - {med.frequency}</p>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button onClick={handleSaveNotes} size="lg">
              <Save className="w-4 h-4 mr-2" />
              Save Clinical Notes
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default PatientConsultationDjango;
