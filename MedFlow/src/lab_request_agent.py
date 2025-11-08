import os
import json
from typing import Dict, Any
from datetime import datetime
from openai import OpenAI
from prompt_loader import PromptLoader


class LabRequestGenerator:
    
    def __init__(self, api_key: str = None, prompts_file: str = None):
        self.api_key = api_key or os.getenv('OPENAI_API_KEY')
        if not self.api_key:
            raise ValueError("OpenAI API key required")
        self.client = OpenAI(api_key=self.api_key)
        self.prompt_loader = PromptLoader(prompts_file)
        self.config = self.prompt_loader.get_config('lab_request_generation')
    
    def generate_lab_request(
        self, 
        soap_note: Dict[str, str], 
        patient_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        plan = soap_note.get('plan', '')
        if not plan:
            return {
                "request_type": "none",
                "message": "No plan found in SOAP note"
            }
        
        assessment = soap_note.get('assessment', '')
        
        context = f"""
ASSESSMENT:
{assessment}

PLAN:
{plan}
"""
        
        try:
            user_message = self.config['user_message_template'].format(
                context=context
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
            lab_request = json.loads(content)
            
            if lab_request.get('request_type') == 'none':
                return lab_request
            
            complete_requisition = self._create_complete_requisition(
                lab_request, 
                patient_data
            )
            
            return complete_requisition
            
        except json.JSONDecodeError as e:
            raise Exception(f"Failed to parse JSON response: {str(e)}")
        except Exception as e:
            raise Exception(f"Error generating lab request: {str(e)}")
    
    def _create_complete_requisition(
        self, 
        lab_request: Dict[str, Any], 
        patient_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        requisition = {
            "requisition_type": "laboratory_test_request",
            "requisition_id": f"LAB-REQ-{datetime.now().strftime('%Y%m%d-%H%M%S')}",
            "created_at": datetime.now().isoformat(),
            "status": "pending",
            "patient_information": {},
            "ordering_provider": {},
            "test_details": lab_request,
            "billing_information": {},
            "specimen_collection": {
                "collection_date": None,
                "collection_time": None,
                "collected_by": None,
                "collection_site": None
            }
        }
        
        if patient_data.get('personal_info'):
            pi = patient_data['personal_info']
            requisition['patient_information'] = {
                "full_name": pi.get('full_name'),
                "first_name": pi.get('first_name'),
                "last_name": pi.get('last_name'),
                "date_of_birth": pi.get('date_of_birth'),
                "age": pi.get('age'),
                "gender": pi.get('gender')
            }
        
        if patient_data.get('identifiers'):
            requisition['patient_information']['identifiers'] = patient_data['identifiers']
        
        if patient_data.get('contact_info'):
            requisition['patient_information']['contact'] = {
                "phone": patient_data['contact_info'].get('phone'),
                "email": patient_data['contact_info'].get('email')
            }
        
        if patient_data.get('medical_context'):
            mc = patient_data['medical_context']
            requisition['ordering_provider'] = {
                "name": mc.get('referring_physician') or mc.get('primary_care_physician'),
                "order_date": mc.get('visit_date'),
                "order_time": mc.get('visit_time')
            }
        
        if patient_data.get('insurance'):
            requisition['billing_information'] = {
                "insurance_provider": patient_data['insurance'].get('provider'),
                "policy_number": patient_data['insurance'].get('policy_number'),
                "group_number": patient_data['insurance'].get('group_number'),
                "subscriber_name": patient_data['insurance'].get('subscriber_name'),
                "subscriber_relationship": patient_data['insurance'].get('subscriber_relationship')
            }
        
        if patient_data.get('medical_history_summary', {}).get('chronic_conditions'):
            requisition['billing_information']['diagnosis_codes'] = {
                "conditions": patient_data['medical_history_summary']['chronic_conditions']
            }
        
        return self._clean_empty_fields(requisition)
    
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
    
    def format_requisition(self, requisition: Dict[str, Any]) -> str:
        if requisition.get('request_type') == 'none':
            return requisition.get('message', 'No lab tests requested')
        
        output = ["LABORATORY TEST REQUISITION", "=" * 80, ""]
        
        output.append(f"Requisition ID: {requisition.get('requisition_id')}")
        output.append(f"Status: {requisition.get('status', 'pending').upper()}")
        output.append(f"Created: {requisition.get('created_at')}")
        output.append("")
        
        if requisition.get('patient_information'):
            output.append("PATIENT INFORMATION:")
            pi = requisition['patient_information']
            if pi.get('full_name'):
                output.append(f"  Name: {pi['full_name']}")
            if pi.get('date_of_birth'):
                output.append(f"  DOB: {pi['date_of_birth']} (Age: {pi.get('age')})")
            if pi.get('gender'):
                output.append(f"  Gender: {pi['gender']}")
            if pi.get('identifiers'):
                for key, value in pi['identifiers'].items():
                    output.append(f"  {key.replace('_', ' ').title()}: {value}")
            output.append("")
        
        if requisition.get('ordering_provider'):
            output.append("ORDERING PROVIDER:")
            op = requisition['ordering_provider']
            if op.get('name'):
                output.append(f"  Physician: {op['name']}")
            if op.get('order_date'):
                output.append(f"  Order Date: {op['order_date']}")
            output.append("")
        
        if requisition.get('test_details'):
            td = requisition['test_details']
            
            if td.get('request_metadata'):
                meta = td['request_metadata']
                output.append("REQUEST DETAILS:")
                if meta.get('clinical_indication'):
                    output.append(f"  Clinical Indication: {meta['clinical_indication']}")
                if meta.get('urgency'):
                    output.append(f"  Urgency: {meta['urgency'].upper()}")
                if meta.get('special_instructions'):
                    output.append(f"  Special Instructions:")
                    for instruction in meta['special_instructions']:
                        output.append(f"    • {instruction}")
                output.append("")
            
            if td.get('tests_requested'):
                output.append("TESTS REQUESTED:")
                for i, test in enumerate(td['tests_requested'], 1):
                    output.append(f"  {i}. {test.get('test_name', 'Unknown Test')}")
                    if test.get('test_type'):
                        output.append(f"     Type: {test['test_type'].title()}")
                    if test.get('clinical_indication'):
                        output.append(f"     Indication: {test['clinical_indication']}")
                    if test.get('specimen_type'):
                        output.append(f"     Specimen: {test['specimen_type'].title()}")
                    if test.get('fasting_required'):
                        output.append(f"     ⚠️  FASTING REQUIRED")
                    if test.get('priority') and test['priority'] != 'routine':
                        output.append(f"     Priority: {test['priority'].upper()}")
                    output.append("")
            
            if td.get('follow_up'):
                fu = td['follow_up']
                output.append("FOLLOW-UP:")
                if fu.get('review_date'):
                    output.append(f"  Review Results: {fu['review_date']}")
                if fu.get('next_appointment'):
                    output.append(f"  Next Appointment: {fu['next_appointment']}")
                if fu.get('callback_required'):
                    output.append(f"  Callback Required: Yes")
                output.append("")
        
        if requisition.get('billing_information'):
            output.append("BILLING INFORMATION:")
            bi = requisition['billing_information']
            if bi.get('insurance_provider'):
                output.append(f"  Insurance: {bi['insurance_provider']}")
            if bi.get('policy_number'):
                output.append(f"  Policy #: {bi['policy_number']}")
            if bi.get('group_number'):
                output.append(f"  Group #: {bi['group_number']}")
            output.append("")
        
        output.append("=" * 80)
        return "\n".join(output)