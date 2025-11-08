import os
import json
from typing import Dict, Any, List
from datetime import datetime, timedelta
from openai import OpenAI
from prompt_loader import PromptLoader


class PharmacyRequestGenerator:
    
    def __init__(self, api_key: str = None, prompts_file: str = None):
        self.api_key = api_key or os.getenv('OPENAI_API_KEY')
        if not self.api_key:
            raise ValueError("OpenAI API key required")
        self.client = OpenAI(api_key=self.api_key)
        self.prompt_loader = PromptLoader(prompts_file)
        self.config = self.prompt_loader.get_config('pharmacy_request_generation')
    
    def generate_pharmacy_request(
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
            pharmacy_request = json.loads(content)
            
            if pharmacy_request.get('request_type') == 'none':
                return pharmacy_request
            
            complete_requisition = self._create_complete_requisition(
                pharmacy_request, 
                patient_data,
                soap_note
            )
            
            return complete_requisition
            
        except json.JSONDecodeError as e:
            raise Exception(f"Failed to parse JSON response: {str(e)}")
        except Exception as e:
            raise Exception(f"Error generating pharmacy request: {str(e)}")
    
    def _create_complete_requisition(
        self, 
        pharmacy_request: Dict[str, Any], 
        patient_data: Dict[str, Any],
        soap_note: Dict[str, str]
    ) -> Dict[str, Any]:
        requisition = {
            "requisition_type": "pharmacy_prescription_request",
            "requisition_id": f"RX-{datetime.now().strftime('%Y%m%d-%H%M%S')}",
            "created_at": datetime.now().isoformat(),
            "status": "pending",
            "valid_until": (datetime.now() + timedelta(days=365)).isoformat(),
            "patient_information": {},
            "prescriber_information": {},
            "prescription_details": pharmacy_request,
            "pharmacy_information": {
                "pharmacy_name": None,
                "pharmacy_phone": None,
                "pharmacy_address": None,
                "pharmacy_npi": None
            },
            "billing_information": {},
            "patient_safety": {
                "known_allergies": [],
                "current_medications": [],
                "contraindications_checked": True
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
                "address": patient_data['contact_info'].get('address')
            }
        
        if patient_data.get('medical_context'):
            mc = patient_data['medical_context']
            requisition['prescriber_information'] = {
                "name": mc.get('referring_physician') or mc.get('primary_care_physician'),
                "prescription_date": mc.get('visit_date'),
                "dea_number": None,
                "npi_number": None,
                "phone": None,
                "address": None
            }
        
        if patient_data.get('insurance'):
            requisition['billing_information'] = {
                "insurance_provider": patient_data['insurance'].get('provider'),
                "policy_number": patient_data['insurance'].get('policy_number'),
                "group_number": patient_data['insurance'].get('group_number'),
                "bin_number": None,
                "pcn_number": None,
                "cardholder_id": patient_data['insurance'].get('insurance_id')
            }
        
        if patient_data.get('medical_history_summary'):
            mhs = patient_data['medical_history_summary']
            requisition['patient_safety']['known_allergies'] = mhs.get('known_allergies', [])
            requisition['patient_safety']['current_medications'] = mhs.get('current_medications', [])
        
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
            return requisition.get('message', 'No prescriptions requested')
        
        output = ["PHARMACY PRESCRIPTION REQUISITION", "=" * 80, ""]
        
        output.append(f"Requisition ID: {requisition.get('requisition_id')}")
        output.append(f"Status: {requisition.get('status', 'pending').upper()}")
        output.append(f"Created: {requisition.get('created_at')}")
        output.append(f"Valid Until: {requisition.get('valid_until')}")
        output.append("")
        
        if requisition.get('patient_information'):
            output.append("PATIENT INFORMATION:")
            pi = requisition['patient_information']
            if pi.get('full_name'):
                output.append(f"  Name: {pi['full_name']}")
            if pi.get('date_of_birth'):
                output.append(f"  DOB: {pi['date_of_birth']} (Age: {pi.get('age')})")
            if pi.get('identifiers'):
                for key, value in pi['identifiers'].items():
                    output.append(f"  {key.replace('_', ' ').title()}: {value}")
            output.append("")
        
        if requisition.get('prescriber_information'):
            output.append("PRESCRIBER INFORMATION:")
            pi = requisition['prescriber_information']
            if pi.get('name'):
                output.append(f"  Physician: {pi['name']}")
            if pi.get('prescription_date'):
                output.append(f"  Date: {pi['prescription_date']}")
            output.append("")
        
        if requisition.get('prescription_details'):
            pd = requisition['prescription_details']
            
            if pd.get('request_metadata'):
                meta = pd['request_metadata']
                output.append("PRESCRIPTION SUMMARY:")
                if meta.get('clinical_context'):
                    output.append(f"  Clinical Context: {meta['clinical_context']}")
                if meta.get('total_prescriptions'):
                    output.append(f"  Total Prescriptions: {meta['total_prescriptions']}")
                if meta.get('urgency'):
                    output.append(f"  Urgency: {meta['urgency'].upper()}")
                output.append("")
            
            if pd.get('prescriptions'):
                output.append("PRESCRIPTIONS:")
                output.append("=" * 80)
                for rx in pd['prescriptions']:
                    output.append(f"\nRx #{rx.get('prescription_number', '?')}")
                    output.append("-" * 80)
                    
                    if rx.get('medication'):
                        med = rx['medication']
                        med_name = med.get('generic_name', 'Unknown')
                        if med.get('brand_name'):
                            med_name += f" ({med['brand_name']})"
                        output.append(f"Medication: {med_name}")
                        if med.get('strength'):
                            output.append(f"Strength: {med['strength']}")
                        if med.get('dosage_form'):
                            output.append(f"Form: {med['dosage_form'].title()}")
                    
                    if rx.get('directions'):
                        dir = rx['directions']
                        output.append(f"\nDirections:")
                        sig = []
                        if dir.get('dose'):
                            sig.append(dir['dose'])
                        if dir.get('route'):
                            sig.append(f"by {dir['route']}")
                        if dir.get('frequency'):
                            sig.append(dir['frequency'])
                        if dir.get('timing'):
                            sig.append(dir['timing'])
                        output.append(f"  SIG: {' '.join(sig)}")
                        
                        if dir.get('special_instructions'):
                            output.append(f"  Special Instructions:")
                            for inst in dir['special_instructions']:
                                output.append(f"    • {inst}")
                    
                    if rx.get('supply'):
                        sup = rx['supply']
                        output.append(f"\nSupply:")
                        if sup.get('quantity'):
                            output.append(f"  Quantity: {sup['quantity']} {sup.get('unit', '')}")
                        if sup.get('days_supply'):
                            output.append(f"  Days Supply: {sup['days_supply']}")
                        if sup.get('refills') is not None:
                            output.append(f"  Refills: {sup['refills']}")
                    
                    if rx.get('clinical_info'):
                        ci = rx['clinical_info']
                        if ci.get('indication'):
                            output.append(f"\nIndication: {ci['indication']}")
                        if ci.get('is_new_prescription'):
                            output.append(f"Status: NEW PRESCRIPTION")
                        if ci.get('is_dose_change') and ci.get('previous_dose'):
                            output.append(f"Status: DOSE CHANGE (from {ci['previous_dose']})")
                        if ci.get('controlled_substance'):
                            output.append(f"⚠️  CONTROLLED SUBSTANCE - Schedule {ci.get('dea_schedule', 'Unknown')}")
                    
                    if rx.get('safety'):
                        safety = rx['safety']
                        if safety.get('warnings'):
                            output.append(f"\n⚠️  WARNINGS:")
                            for warning in safety['warnings']:
                                output.append(f"    • {warning}")
                    
                    output.append("")
            
            if pd.get('discontinued_medications'):
                output.append("\nDISCONTINUED MEDICATIONS:")
                for disc in pd['discontinued_medications']:
                    output.append(f"  ✗ {disc.get('medication_name')} - {disc.get('reason')}")
                output.append("")
            
            if pd.get('patient_instructions'):
                output.append("\nPATIENT INSTRUCTIONS:")
                for inst in pd['patient_instructions']:
                    output.append(f"  • {inst}")
                output.append("")
        
        if requisition.get('patient_safety'):
            ps = requisition['patient_safety']
            if ps.get('known_allergies'):
                output.append("PATIENT ALLERGIES:")
                for allergy in ps['known_allergies']:
                    output.append(f"  ⚠️  {allergy}")
                output.append("")
        
        output.append("=" * 80)
        return "\n".join(output)
    
    def generate_patient_medication_list(self, requisition: Dict[str, Any]) -> List[str]:
        if requisition.get('request_type') == 'none':
            return []
        
        med_list = []
        prescriptions = requisition.get('prescription_details', {}).get('prescriptions', [])
        
        for rx in prescriptions:
            med = rx.get('medication', {})
            dir = rx.get('directions', {})
            
            med_name = med.get('generic_name', 'Unknown')
            strength = med.get('strength', '')
            frequency = dir.get('frequency', '')
            
            med_str = f"{med_name} {strength} - {frequency}".strip()
            med_list.append(med_str)
        
        return med_list
