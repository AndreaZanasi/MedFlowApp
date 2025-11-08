"""
API views for React frontend integration
"""
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
import json
import os
import sys
from pathlib import Path
from openai import OpenAI
from datetime import datetime
from .patient_storage import patient_storage

# Add the src directory to the path
src_path = Path(__file__).parent / 'src'
sys.path.insert(0, str(src_path))

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


@api_view(['POST'])
@permission_classes([AllowAny])
def api_login(request):
    """Login endpoint for React frontend"""
    try:
        data = json.loads(request.body)
        email = data.get('email')
        password = data.get('password')
        
        # For demo purposes, using username as email
        user = authenticate(request, username=email, password=password)
        
        if user is not None:
            login(request, user)
            return Response({
                'success': True,
                'user': {
                    'id': user.id,
                    'email': user.email or email,
                    'username': user.username,
                }
            })
        else:
            return Response({
                'success': False,
                'error': 'Invalid credentials'
            }, status=status.HTTP_401_UNAUTHORIZED)
            
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def api_logout(request):
    """Logout endpoint"""
    logout(request)
    return Response({'success': True})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def api_current_user(request):
    """Get current user info"""
    user = request.user
    return Response({
        'id': user.id,
        'email': user.email or user.username,
        'username': user.username,
    })


@api_view(['POST'])
@csrf_exempt
@permission_classes([AllowAny])
def api_transcribe_audio(request):
    """Transcribe audio file - API version"""
    try:
        audio_file = request.FILES.get('audio')
        if not audio_file:
            return Response({'error': 'No audio file provided'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Create audio directory if it doesn't exist
        audio_dir = Path(__file__).parent / 'audio_recordings'
        audio_dir.mkdir(exist_ok=True)
        
        # Generate filename with timestamp, preserving original extension
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
            
            transcription_text = transcription.text
            print(f"✓ Transcription successful")
            print(f"  Length: {len(transcription_text)} characters\n")
            
            return Response({
                'success': True,
                'transcription': transcription_text,
                'audio_file': audio_filename
            })
            
        except Exception as e:
            print(f"❌ Transcription failed: {str(e)}")
            return Response({
                'error': f'Transcription failed: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@csrf_exempt
@permission_classes([AllowAny])
def api_process_transcription(request):
    """Process transcription through all agents - API version"""
    try:
        data = json.loads(request.body)
        transcription = data.get('transcription', '')
        audio_filename = data.get('audio_file', '')
        
        if not transcription:
            return Response({'error': 'No transcription provided'}, status=status.HTTP_400_BAD_REQUEST)
        
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
        
        # Save patient visit to storage
        patient_name = patient_data.get('personal_info', {}).get('full_name', 'Unknown')
        if patient_name != 'Unknown':
            visit_data = {
                'patient_name': patient_name,
                'patient_mrn': f"{patient_name[:3].upper()}-{datetime.now().year}-{datetime.now().strftime('%m%d%H%M')}",
                'transcription': transcription,
                'patient_data': patient_data,
                'soap_note': soap_note,
                'clinical_data': clinical_data,
                'lab_requisition': lab_requisition,
                'pharmacy_requisition': pharmacy_requisition,
                'audio_file': audio_filename,
            }
            visit_id = patient_storage.save_patient_visit(visit_data)
            print(f"✓ Patient visit saved: {visit_id}\n")
        
        # Return all data
        return Response({
            'success': True,
            'transcription': transcription,
            'patient_data': patient_data,
            'soap_note': soap_note,
            'clinical_data': clinical_data,
            'lab_requisition': lab_requisition,
            'pharmacy_requisition': pharmacy_requisition,
            'metadata': {
                'generated_at': datetime.now().isoformat(),
                'audio_file': audio_filename,
                'timestamp': timestamp
            }
        })
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowAny])
def api_health_check(request):
    """Health check endpoint"""
    return Response({
        'status': 'healthy',
        'service': 'MedFlow API',
        'timestamp': datetime.now().isoformat()
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def api_get_all_patients(request):
    """Get all patients"""
    try:
        patients = patient_storage.get_all_patients()
        return Response({
            'success': True,
            'patients': patients,
            'count': len(patients)
        })
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowAny])
def api_get_patient(request, patient_name):
    """Get specific patient summary"""
    try:
        patient = patient_storage.get_patient_summary(patient_name)
        if patient:
            return Response({
                'success': True,
                'patient': patient
            })
        else:
            return Response({
                'error': 'Patient not found'
            }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowAny])
def api_get_patient_visits(request, patient_name):
    """Get all visits for a patient"""
    try:
        visits = patient_storage.get_patient_visits(patient_name)
        return Response({
            'success': True,
            'visits': visits,
            'count': len(visits)
        })
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['PUT'])
@permission_classes([AllowAny])
def api_update_patient_visit(request, patient_name, visit_id):
    """Update a patient visit record"""
    try:
        updated_data = request.data
        
        # Validate that we have data to update
        if not updated_data:
            return Response({
                'error': 'No data provided for update'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Update the visit
        success = patient_storage.update_patient_visit(patient_name, visit_id, updated_data)
        
        if success:
            return Response({
                'success': True,
                'message': 'Visit updated successfully'
            })
        else:
            return Response({
                'error': 'Visit not found'
            }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
