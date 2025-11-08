"""
Legacy views for Django MedFlow application.
Note: These views are deprecated and kept only for backward compatibility.
The main application now uses api_views.py for the React frontend.
All functionality has been moved to api_views.py
"""
from django.http import HttpResponse


# Legacy HTML views - deprecated, kept for backward compatibility only
def audio_transcription_page(request):
    """Deprecated: Use React frontend instead"""
    return HttpResponse("This page has been replaced by the React frontend. Please visit the main application at the configured frontend URL.")


def upload_audio_page(request):
    """Deprecated: Use React frontend instead"""
    return HttpResponse("This page has been replaced by the React frontend. Please visit the main application at the configured frontend URL.")


def results_page(request):
    """Deprecated: Use React frontend instead"""
    return HttpResponse("This page has been replaced by the React frontend. Please visit the main application at the configured frontend URL.")


def transcribe_audio(request):
    """Deprecated: Use /api/transcribe/ endpoint instead"""
    return HttpResponse("This endpoint has been replaced. Please use /api/transcribe/ instead.")


def process_transcription(request):
    """Deprecated: Use /api/process/ endpoint instead"""
    return HttpResponse("This endpoint has been replaced. Please use /api/process/ instead.")
