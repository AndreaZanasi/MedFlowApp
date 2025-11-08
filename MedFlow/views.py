import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.shortcuts import render
from openai import OpenAI
import os
import tempfile
import sys
from pathlib import Path

# Add the src directory to the path
src_path = Path(__file__).parent / 'src'
sys.path.insert(0, str(src_path))

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def audio_transcription_page(request):
    """Serve the audio transcription HTML page"""
    return render(request, 'audio_transcription.html')

def upload_audio_page(request):
    """Serve the upload audio HTML page"""
    return render(request, 'upload_audio.html')

@csrf_exempt
def transcribe_audio(request):
    if request.method == 'POST':
        try:
            audio_file = request.FILES.get('audio')
            if not audio_file:
                return JsonResponse({'error': 'No audio file provided'}, status=400)
            
            # Create audio directory if it doesn't exist
            audio_dir = Path(__file__).parent / 'audio_recordings'
            audio_dir.mkdir(exist_ok=True)
            
            # Generate filename with timestamp, preserving original extension
            from datetime import datetime
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            
            # Get original file extension
            original_filename = audio_file.name
            if '.' in original_filename:
                original_extension = original_filename.rsplit('.', 1)[1].lower()
            else:
                original_extension = 'webm'  # default for recordings
            
            audio_filename = f'recording_{timestamp}.{original_extension}'
            audio_path = audio_dir / audio_filename
            
            # Save the audio file permanently
            with open(audio_path, 'wb') as f:
                for chunk in audio_file.chunks():
                    f.write(chunk)
            
            print(f"\n✓ Audio file saved: {audio_path}")
            print(f"  - Original filename: {original_filename}")
            print(f"  - Extension: {original_extension}")
            print(f"  - File size: {audio_path.stat().st_size} bytes")
            print(f"  - MIME type: {audio_file.content_type}")
            
            try:
                # Open the file and send to OpenAI
                with open(audio_path, 'rb') as audio_data:
                    print(f"  - Sending to OpenAI Whisper API...")
                    # Pass the file with a tuple (filename, file_object) for proper format detection
                    transcription = client.audio.transcriptions.create(
                        model="whisper-1",
                        file=(audio_filename, audio_data, f'audio/{original_extension}')
                    )
                
                # Print transcription to terminal
                print("\n" + "="*50)
                print("TRANSCRIPTION:")
                print(transcription.text)
                print("="*50 + "\n")
                
                return JsonResponse({
                    'transcription': transcription.text,
                    'audio_file': audio_filename
                })
                
            except Exception as e:
                return JsonResponse({'error': f'Transcription failed: {str(e)}'}, status=500)
                
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
    
    return JsonResponse({'error': 'Only POST requests are allowed'}, status=405)

@csrf_exempt
def process_transcription(request):
    """Process the transcription through all agents and return structured data"""
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            transcription = data.get('transcription', '')
            audio_filename = data.get('audio_file', '')
            
            if not transcription:
                return JsonResponse({'error': 'No transcription provided'}, status=400)
            
            print("\n" + "="*80)
            print("PROCESSING TRANSCRIPTION THROUGH AGENTS")
            print("="*80)
            print(f"Audio file: {audio_filename}")
            
            # Import agents
            from soap_generator_agent import SOAPNoteGenerator
            from data_extractor_agent import SOAPDataExtractor
            from patient_agent import PatientDataExtractor
            from lab_request_agent import LabRequestGenerator
            from pharmacy_request_agent import PharmacyRequestGenerator
            
            # Extract Patient Data
            print("[1/5] Extracting patient data...")
            patient_extractor = PatientDataExtractor()
            patient_data = patient_extractor.extract_patient_data(transcription)
            
            # Generate SOAP Note
            print("[2/5] Generating SOAP note...")
            soap_generator = SOAPNoteGenerator()
            soap_note = soap_generator.generate_soap_note(transcription)
            
            # Extract Clinical Data
            print("[3/5] Extracting clinical data...")
            data_extractor = SOAPDataExtractor()
            clinical_data = data_extractor.extract_data(soap_note)
            
            # Generate Lab Request
            print("[4/5] Generating lab requisition...")
            lab_generator = LabRequestGenerator()
            lab_requisition = lab_generator.generate_lab_request(soap_note, patient_data)
            
            # Generate Pharmacy Request
            print("[5/5] Generating pharmacy requisition...")
            pharmacy_generator = PharmacyRequestGenerator()
            pharmacy_requisition = pharmacy_generator.generate_pharmacy_request(soap_note, patient_data)
            
            print("✓ All agents completed successfully\n")
            
            # Save complete record to file
            from datetime import datetime
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            output_dir = Path(__file__).parent / 'src' / 'output'
            output_dir.mkdir(exist_ok=True)
            
            complete_record = {
                "metadata": {
                    "generated_at": datetime.now().isoformat(),
                    "audio_file": audio_filename,
                    "timestamp": timestamp
                },
                "transcription": transcription,
                "patient_demographics": patient_data,
                "soap_note": soap_note,
                "clinical_data": clinical_data,
                "lab_requisition": lab_requisition,
                "pharmacy_requisition": pharmacy_requisition
            }
            
            output_file = output_dir / f'complete_record_{timestamp}.json'
            with open(output_file, 'w') as f:
                json.dump(complete_record, f, indent=2)
            
            print(f"✓ Complete record saved: {output_file}\n")
            
            # Return all data
            return JsonResponse({
                'success': True,
                'audio_file': audio_filename,
                'patient_data': patient_data,
                'soap_note': soap_note,
                'clinical_data': clinical_data,
                'lab_requisition': lab_requisition,
                'pharmacy_requisition': pharmacy_requisition
            })
            
        except Exception as e:
            print(f"Error processing transcription: {e}")
            import traceback
            traceback.print_exc()
            return JsonResponse({'error': str(e)}, status=500)
    
    return JsonResponse({'error': 'Only POST requests are allowed'}, status=405)

def results_page(request):
    """Serve the results page"""
    return render(request, 'results.html')