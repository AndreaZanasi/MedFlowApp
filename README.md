# MedFlow - AI-Powered Clinical Assistant

MedFlow is a comprehensive medical documentation system that uses AI to transcribe consultations, generate SOAP notes, and manage patient records. The application combines a Django backend with a React frontend to provide a seamless clinical workflow experience.

## 🏗️ Architecture

- **Backend**: Django 3.2.12 with REST API
- **Frontend**: React 18.3.1 with TypeScript, Vite, and Shadcn/UI
- **AI Processing**: OpenAI Whisper for transcription, custom AI agents for SOAP generation
- **Storage**: JSON file-based patient data storage (no database required)
- **Audio Support**: M4A, MP3, WAV, WebM, OGG, FLAC

## 📁 Project Structure

```
MedFlowApp/
├── MedFlow/                          # Django app
│   ├── api_views.py                  # REST API endpoints
│   ├── patient_storage.py            # JSON-based patient data management
│   ├── models.py                     # Django models
│   ├── audio_recordings/             # Uploaded/recorded audio files
│   ├── patient_data/                 # Patient JSON records
│   │   └── {patient_name}/
│   │       ├── patient_summary.json
│   │       └── visit_*.json
│   └── src/                          # AI agents
│       ├── main.py
│       ├── data_extractor_agent.py
│       ├── soap_generator_agent.py
│       ├── patient_agent.py
│       ├── lab_request_agent.py
│       ├── pharmacy_request_agent.py
│       └── output/                   # Complete records
│
├── medflow-assist-ai/                # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── app/                  # Application components
│   │   │   │   ├── PatientConsultationDjango.tsx
│   │   │   │   ├── ClinicalNotes.tsx
│   │   │   │   ├── PatientListView.tsx
│   │   │   │   ├── PatientDetailsModal.tsx
│   │   │   │   └── ...
│   │   │   └── ui/                   # Shadcn/UI components
│   │   ├── hooks/
│   │   │   ├── useDjangoAuth.tsx
│   │   │   ├── useVoiceRecording.tsx
│   │   │   └── ...
│   │   ├── pages/
│   │   │   └── Dashboard.tsx
│   │   └── services/
│   │       └── api.ts                # API client
│   └── package.json
│
├── MedFlowApp/                       # Django project settings
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
│
├── manage.py
├── requirements.txt
└── README.md
```

## 🚀 Getting Started

### Prerequisites

1. **Python 3.11** (via conda environment)
2. **Node.js 18+** and npm
3. **OpenAI API Key** (for Whisper transcription and AI agents)

### Installation

#### 1. Clone the Repository

```bash
git clone https://github.com/AndreaZanasi/MedFlowApp.git
cd MedFlowApp
```

#### 2. Set Up Python Environment

```bash
# Create conda environment (if not already created)
conda create -n hack python=3.11
conda activate hack

# Install Python dependencies
pip install -r requirements.txt
```

#### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```bash
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Django Configuration
SECRET_KEY=your_django_secret_key_here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
```

#### 4. Set Up Frontend

```bash
cd medflow-assist-ai
npm install
cd ..
```

### Running the Application

You need to run both the Django backend and React frontend simultaneously.

#### Option 1: Manual Start (Two Terminals)

**Terminal 1 - Django Backend:**
```bash
cd /path/to/MedFlowApp
conda activate hack
python manage.py runserver 8001
```

**Terminal 2 - React Frontend:**
```bash
cd /path/to/MedFlowApp/medflow-assist-ai
npm run dev
```

#### Option 2: Quick Start Script

Create a `start.sh` file:

```bash
#!/bin/bash
echo "Starting MedFlow Application..."

# Start Django backend
cd /path/to/MedFlowApp
conda run -n hack python manage.py runserver 8001 &
DJANGO_PID=$!

# Start React frontend
cd medflow-assist-ai
npm run dev &
FRONTEND_PID=$!

echo "Django backend running on http://localhost:8001"
echo "React frontend running on http://localhost:8080"
echo "Press Ctrl+C to stop all servers"

# Wait for Ctrl+C
trap "kill $DJANGO_PID $FRONTEND_PID; exit" INT
wait
```

Make it executable and run:
```bash
chmod +x start.sh
./start.sh
```

### Access the Application

Once both servers are running:
- **Frontend UI**: http://localhost:8080
- **Backend API**: http://localhost:8001/api/

## 📖 Features

### 1. Live Consultation
- **Record Audio**: Direct recording from browser microphone
- **Upload Audio**: Support for M4A, MP3, WAV, WebM, OGG, FLAC files
- **Real-time Transcription**: Using OpenAI Whisper API
- **AI Processing**: Automatic generation of SOAP notes, prescriptions, and lab orders

### 2. Clinical Notes
- **View All Notes**: Browse all generated SOAP notes
- **Edit Notes**: Modify any section of generated notes
- **Save Changes**: Update patient records with edited information
- **Filter & Search**: Find specific notes quickly

### 3. Patient Management
- **Patient Grid View**: Visual display of all patients
- **Visit History**: Complete timeline of patient visits
- **Detailed Records**: View SOAP notes, prescriptions, lab orders, and demographics
- **JSON Storage**: All data stored in organized JSON files

### 4. Tasks & Workflows
- **Task Queue**: Pending actions and follow-ups
- **Status Tracking**: Monitor consultation and processing status

### 5. Dashboard Overview
- **Statistics**: Patient count, consultations, notes generated
- **Quick Actions**: Fast access to common tasks

## 🔧 Technical Details

### Backend API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/` | POST | User authentication |
| `/api/transcribe/` | POST | Transcribe audio file |
| `/api/process/` | POST | Process transcription with AI agents |
| `/api/patients/` | GET | List all patients |
| `/api/patients/{name}/` | GET | Get specific patient data |
| `/api/patients/{name}/visits/{visit_id}/` | PUT | Update patient visit data |

### Data Structure

#### Patient Visit JSON
```json
{
  "visit_id": "visit_20251108_151501",
  "timestamp": "2025-11-08T15:15:01",
  "audio_file": "recording_20251108_151501.m4a",
  "transcription": "...",
  "soap_note": {
    "subjective": "...",
    "objective": "...",
    "assessment": "...",
    "plan": "..."
  },
  "patient_data": {
    "personal_info": {
      "name": "John Doe",
      "age": 45,
      "gender": "Male"
    }
  },
  "pharmacy_requisition": {
    "prescription_details": {
      "prescriptions": [...]
    }
  },
  "lab_requisition": {
    "tests": [...]
  }
}
```

### AI Agent Workflow

1. **Audio Upload/Recording** → Saved to `audio_recordings/`
2. **Transcription** → OpenAI Whisper API
3. **Data Extraction** → Extract patient demographics and clinical info
4. **SOAP Generation** → Generate structured clinical note
5. **Pharmacy Agent** → Create prescription requisitions
6. **Lab Agent** → Generate lab test orders
7. **Patient Storage** → Save complete record to JSON files

## 🛠️ Development

### Frontend Development

```bash
cd medflow-assist-ai

# Run dev server with hot reload
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

### Backend Development

```bash
# Run Django development server
python manage.py runserver 8001

# Create migrations (if models change)
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser
```

### Adding New Dependencies

**Python:**
```bash
conda activate hack
pip install package_name
pip freeze > requirements.txt
```

**Node.js:**
```bash
cd medflow-assist-ai
npm install package_name
```

## 📝 Configuration

### Django Settings
- **CORS**: Configured to allow requests from `localhost:8080`
- **Media Files**: Audio recordings stored in `MedFlow/audio_recordings/`
- **Data Storage**: Patient data in `MedFlow/patient_data/`

### Frontend Proxy
Vite is configured to proxy API requests to Django:
```typescript
// vite.config.ts
proxy: {
  '/api': {
    target: 'http://localhost:8001',
    changeOrigin: true
  }
}
```

## 🔒 Security Notes

- Store `.env` file securely and never commit it to version control
- Use strong `SECRET_KEY` in production
- Set `DEBUG=False` in production
- Configure proper `ALLOWED_HOSTS` for production deployment
- Implement proper authentication and authorization for production use

## 📦 Deployment

### Production Checklist

1. Set `DEBUG=False` in Django settings
2. Configure proper `ALLOWED_HOSTS`
3. Use environment variables for sensitive data
4. Set up proper HTTPS/SSL certificates
5. Configure production-grade web server (Nginx + Gunicorn)
6. Set up database (PostgreSQL recommended for production)
7. Configure static file serving
8. Set up monitoring and logging
9. Implement backup strategy for patient data

## 🐛 Troubleshooting

### Django server won't start
- Ensure conda environment is activated: `conda activate hack`
- Check if port 8001 is already in use: `lsof -i :8001`
- Verify all dependencies are installed: `pip install -r requirements.txt`

### Frontend build errors
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Clear npm cache: `npm cache clean --force`
- Check Node.js version: `node --version` (should be 18+)

### Audio upload fails
- Check file format (M4A, MP3, WAV, WebM, OGG, FLAC supported)
- Verify OpenAI API key is set in `.env`
- Check Django logs for detailed error messages

### CORS errors
- Verify frontend is running on port 8080
- Check Django CORS settings in `settings.py`
- Ensure both servers are running

## 📄 License

This project is for medical/educational purposes. Ensure compliance with HIPAA and local data protection regulations when handling patient data.

## 👥 Contributors

- Andrea Zanasi - Initial development

## 🙏 Acknowledgments

- OpenAI for Whisper API and GPT models
- Shadcn/UI for React component library
- Django and React communities

## 📞 Support

For issues, questions, or contributions, please open an issue on the GitHub repository.

---

**Last Updated**: November 8, 2025
