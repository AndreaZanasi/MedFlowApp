from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from openai import OpenAI
import os

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

@csrf_exempt
def transcribe_audio(request):
    if request.method == 'POST' and request.FILES.get('audio'):
        audio_file = request.FILES['audio']

        with open('temp_audio.wav', 'wb+') as dest:
            for chunk in audio_file.chunks():
                dest.write(chunk)

        with open('temp_audio.wav', 'rb') as f:
            transcription = client.audio.transcriptions.create(
                model="gpt-4o-mini-transcribe",
                file=f,
            )

        return JsonResponse({'text': transcription.text})

    return JsonResponse({'error': 'No audio uploaded'}, status=400)
