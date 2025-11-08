"""
Patient data storage using JSON files
Simple file-based storage until database is implemented
"""
import json
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Optional


class PatientStorage:
    def __init__(self):
        self.storage_dir = Path(__file__).parent / 'patient_data'
        self.storage_dir.mkdir(exist_ok=True)
        
    def save_patient_visit(self, patient_data: Dict) -> str:
        """Save a patient visit record"""
        # Create patient directory
        patient_name = patient_data.get('patient_name', 'Unknown')
        patient_dir = self.storage_dir / self._sanitize_filename(patient_name)
        patient_dir.mkdir(exist_ok=True)
        
        # Generate visit ID
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        visit_id = f'visit_{timestamp}'
        
        # Add metadata
        visit_record = {
            'visit_id': visit_id,
            'timestamp': datetime.now().isoformat(),
            'patient_name': patient_name,
            **patient_data
        }
        
        # Save visit file
        visit_file = patient_dir / f'{visit_id}.json'
        with open(visit_file, 'w') as f:
            json.dump(visit_record, f, indent=2)
        
        # Update patient summary
        self._update_patient_summary(patient_name, visit_record)
        
        return visit_id
    
    def get_patient_visits(self, patient_name: str) -> List[Dict]:
        """Get all visits for a patient"""
        patient_dir = self.storage_dir / self._sanitize_filename(patient_name)
        if not patient_dir.exists():
            return []
        
        visits = []
        for visit_file in sorted(patient_dir.glob('visit_*.json'), reverse=True):
            with open(visit_file, 'r') as f:
                visits.append(json.load(f))
        
        return visits
    
    def get_all_patients(self) -> List[Dict]:
        """Get summary of all patients"""
        patients = []
        
        for patient_dir in self.storage_dir.iterdir():
            if patient_dir.is_dir():
                summary_file = patient_dir / 'patient_summary.json'
                if summary_file.exists():
                    with open(summary_file, 'r') as f:
                        patients.append(json.load(f))
        
        return sorted(patients, key=lambda x: x.get('last_visit', ''), reverse=True)
    
    def get_patient_summary(self, patient_name: str) -> Optional[Dict]:
        """Get summary for a specific patient"""
        patient_dir = self.storage_dir / self._sanitize_filename(patient_name)
        summary_file = patient_dir / 'patient_summary.json'
        
        if summary_file.exists():
            with open(summary_file, 'r') as f:
                return json.load(f)
        
        return None
    
    def update_patient_visit(self, patient_name: str, visit_id: str, updated_data: Dict) -> bool:
        """Update an existing patient visit record"""
        patient_dir = self.storage_dir / self._sanitize_filename(patient_name)
        visit_file = patient_dir / f'{visit_id}.json'
        
        if not visit_file.exists():
            return False
        
        # Load existing visit
        with open(visit_file, 'r') as f:
            visit_record = json.load(f)
        
        # Update with new data
        visit_record.update(updated_data)
        visit_record['last_modified'] = datetime.now().isoformat()
        
        # Save updated visit
        with open(visit_file, 'w') as f:
            json.dump(visit_record, f, indent=2)
        
        return True
    
    def _update_patient_summary(self, patient_name: str, visit_record: Dict):
        """Update the patient summary file"""
        patient_dir = self.storage_dir / self._sanitize_filename(patient_name)
        summary_file = patient_dir / 'patient_summary.json'
        
        # Load existing summary or create new
        if summary_file.exists():
            with open(summary_file, 'r') as f:
                summary = json.load(f)
        else:
            summary = {
                'patient_name': patient_name,
                'first_visit': visit_record['timestamp'],
                'visit_count': 0,
                'mrn': visit_record.get('patient_mrn', ''),
            }
        
        # Update summary
        summary['visit_count'] += 1
        summary['last_visit'] = visit_record['timestamp']
        
        # Update demographics if present
        if 'patient_data' in visit_record and 'personal_info' in visit_record['patient_data']:
            summary['demographics'] = visit_record['patient_data']['personal_info']
        
        # Save summary
        with open(summary_file, 'w') as f:
            json.dump(summary, f, indent=2)
    
    def _sanitize_filename(self, name: str) -> str:
        """Sanitize patient name for use as filename"""
        return "".join(c for c in name if c.isalnum() or c in (' ', '-', '_')).strip().replace(' ', '_')


# Singleton instance
patient_storage = PatientStorage()
