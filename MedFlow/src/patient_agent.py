import os
import json
from typing import Dict, Any
from openai import OpenAI
from prompt_loader import PromptLoader


class PatientDataExtractor:
    
    def __init__(self, api_key: str = None, prompts_file: str = None):
        self.api_key = api_key or os.getenv('OPENAI_API_KEY')
        if not self.api_key:
            raise ValueError("OpenAI API key required")
        self.client = OpenAI(api_key=self.api_key)
        self.prompt_loader = PromptLoader(prompts_file)
        self.config = self.prompt_loader.get_config('patient_data_extraction')
    
    def extract_patient_data(self, transcription: str) -> Dict[str, Any]:
        if not transcription or len(transcription.strip()) < 20:
            raise ValueError("Transcription too short")
        
        try:
            user_message = self.config['user_message_template'].format(
                transcription=transcription
            )
            
            response = self.client.chat.completions.create(
                model=self.config['model'],
                messages=[
                    {"role": "system", "content": self.config['system_prompt']},
                    {"role": "user", "content": user_message}
                ],
                temperature=self.config['temperature'],
                max_tokens=self.config['max_tokens'],
                response_format={"type": "json_object"}
            )
            
            content = response.choices[0].message.content
            data = json.loads(content)
            
            return self._clean_empty_fields(data)
            
        except json.JSONDecodeError as e:
            raise Exception(f"Failed to parse JSON response: {str(e)}")
        except Exception as e:
            raise Exception(f"Error extracting patient data: {str(e)}")
    
    def _clean_empty_fields(self, data: Dict[str, Any]) -> Dict[str, Any]:
        if isinstance(data, dict):
            return {
                k: self._clean_empty_fields(v) 
                for k, v in data.items() 
                if v is not None and v != {} and v != []
            }
        elif isinstance(data, list):
            return [self._clean_empty_fields(item) for item in data if item]
        else:
            return data
    
    def format_patient_data(self, data: Dict[str, Any]) -> str:
        output = ["PATIENT INFORMATION", "=" * 70, ""]
        
        if data.get('personal_info'):
            output.append("PERSONAL INFORMATION:")
            info = data['personal_info']
            if info.get('full_name'):
                output.append(f"  Name: {info['full_name']}")
            if info.get('date_of_birth'):
                output.append(f"  Date of Birth: {info['date_of_birth']}")
            if info.get('age'):
                output.append(f"  Age: {info['age']} years")
            if info.get('gender'):
                output.append(f"  Gender: {info['gender']}")
            output.append("")
        
        if data.get('contact_info'):
            output.append("CONTACT INFORMATION:")
            contact = data['contact_info']
            if contact.get('phone'):
                output.append(f"  Phone: {contact['phone']}")
            if contact.get('email'):
                output.append(f"  Email: {contact['email']}")
            if contact.get('address'):
                addr = contact['address']
                addr_str = ", ".join([v for v in [
                    addr.get('street'), addr.get('city'), 
                    addr.get('state'), addr.get('zip_code')
                ] if v])
                if addr_str:
                    output.append(f"  Address: {addr_str}")
            output.append("")
        
        if data.get('identifiers'):
            output.append("IDENTIFIERS:")
            for key, value in data['identifiers'].items():
                display_key = key.replace('_', ' ').title()
                output.append(f"  {display_key}: {value}")
            output.append("")
        
        if data.get('insurance'):
            output.append("INSURANCE INFORMATION:")
            for key, value in data['insurance'].items():
                display_key = key.replace('_', ' ').title()
                output.append(f"  {display_key}: {value}")
            output.append("")
        
        if data.get('emergency_contact'):
            output.append("EMERGENCY CONTACT:")
            ec = data['emergency_contact']
            if ec.get('name'):
                output.append(f"  Name: {ec['name']}")
            if ec.get('relationship'):
                output.append(f"  Relationship: {ec['relationship']}")
            if ec.get('phone'):
                output.append(f"  Phone: {ec['phone']}")
            output.append("")
        
        if data.get('medical_context'):
            output.append("VISIT INFORMATION:")
            for key, value in data['medical_context'].items():
                display_key = key.replace('_', ' ').title()
                output.append(f"  {display_key}: {value}")
            output.append("")
        
        if data.get('medical_history_summary'):
            output.append("MEDICAL HISTORY SUMMARY:")
            history = data['medical_history_summary']
            if history.get('known_allergies'):
                output.append(f"  Allergies: {', '.join(history['known_allergies'])}")
            if history.get('chronic_conditions'):
                output.append(f"  Chronic Conditions: {', '.join(history['chronic_conditions'])}")
            if history.get('current_medications'):
                output.append(f"  Current Medications: {', '.join(history['current_medications'])}")
            output.append("")
        
        if data.get('social_history'):
            output.append("SOCIAL HISTORY:")
            for key, value in data['social_history'].items():
                display_key = key.replace('_', ' ').title()
                output.append(f"  {display_key}: {value}")
            output.append("")
        
        output.append("=" * 70)
        return "\n".join(output)
    
    def generate_lab_requisition_data(self, patient_data: Dict[str, Any]) -> Dict[str, Any]:
        lab_data = {
            "patient": {},
            "insurance": {},
            "ordering_physician": {},
            "specimen_collection": {}
        }
        
        if patient_data.get('personal_info'):
            pi = patient_data['personal_info']
            lab_data['patient'] = {
                "name": pi.get('full_name'),
                "dob": pi.get('date_of_birth'),
                "age": pi.get('age'),
                "gender": pi.get('gender')
            }
        
        if patient_data.get('identifiers'):
            lab_data['patient'].update(patient_data['identifiers'])
        
        if patient_data.get('insurance'):
            lab_data['insurance'] = patient_data['insurance']
        
        if patient_data.get('medical_context'):
            mc = patient_data['medical_context']
            lab_data['ordering_physician'] = {
                "name": mc.get('referring_physician') or mc.get('primary_care_physician'),
                "order_date": mc.get('visit_date')
            }
        
        lab_data['specimen_collection'] = {
            "collection_date": patient_data.get('medical_context', {}).get('visit_date'),
            "collection_time": patient_data.get('medical_context', {}).get('visit_time')
        }
        
        return self._clean_empty_fields(lab_data)