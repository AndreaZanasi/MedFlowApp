import json
from pathlib import Path
from dotenv import load_dotenv
from datetime import datetime

env_path = Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

def main():
    simple_transcription = """
    Doctor: Good morning! Your full name?
    
    Patient: Jennifer Martinez.
    
    Doctor: Date of birth?
    
    Patient: April 8th, 1985. I'm 39 years old.
    
    Doctor: Phone number?
    
    Patient: 312-555-7890.
    
    Doctor: Address?
    
    Patient: 456 Pine Street, Chicago, Illinois.
    
    Doctor: Patient ID PT-2024-5567. Any allergies?
    
    Patient: Yes, penicillin.
    
    Doctor: Current medications?
    
    Patient: Lisinopril 10mg daily.
    
    Doctor: Let me check your vitals. Blood pressure 145 over 92. Heart rate 82. 
    Temperature 98.6. Weight 165 pounds. Height 5 feet 5 inches.
    
    Doctor: What brings you in today?
    
    Patient: Headaches for about a week, mostly afternoons. Pretty bad, 6 or 7 out of 10. 
    Also tired all the time.
    
    Doctor: Any dizziness?
    
    Patient: Yes, sometimes.
    
    Doctor: Let me examine you. Neurological exam normal, reflexes good. 
    Heart and lungs normal.
    
    Doctor: Your headaches are related to elevated blood pressure. I'm increasing 
    your Lisinopril from 10mg to 20mg daily. Adding Amlodipine 5mg once daily.
    
    Doctor: I'm ordering a basic metabolic panel and complete blood count.
    
    Doctor: Monitor your blood pressure at home. Come back in two weeks.
    
    Patient: Okay, thank you.
    """
    
    try:
        from soap_generator_agent import SOAPNoteGenerator
        from data_extractor_agent import SOAPDataExtractor
        from patient_agent import PatientDataExtractor
        from lab_request_agent import LabRequestGenerator
        from pharmacy_request_agent import PharmacyRequestGenerator
        
        print("=" * 80)
        print("MEDICAL DOCUMENTATION PIPELINE")
        print("=" * 80)
        print(f"Timestamp: {datetime.now().isoformat()}")
        print("=" * 80)
        
        # Step 1: Extract Patient Data
        print("\n[STEP 1/5] Extracting Patient Demographics...")
        patient_extractor = PatientDataExtractor()
        patient_data = patient_extractor.extract_patient_data(simple_transcription)
        print("✓ Patient data extracted")
        
        # Step 2: Generate SOAP Note
        print("\n[STEP 2/5] Generating SOAP Note...")
        soap_generator = SOAPNoteGenerator()
        soap_note = soap_generator.generate_soap_note(simple_transcription)
        print("✓ SOAP note generated")
        
        # Step 3: Extract Clinical Data
        print("\n[STEP 3/5] Extracting Structured Clinical Data...")
        data_extractor = SOAPDataExtractor()
        clinical_data = data_extractor.extract_data(soap_note)
        print("✓ Clinical data extracted")
        
        # Step 4: Generate Lab Request
        print("\n[STEP 4/5] Generating Lab Test Requisition...")
        lab_generator = LabRequestGenerator()
        lab_requisition = lab_generator.generate_lab_request(soap_note, patient_data)
        print("✓ Lab requisition generated")
        
        # Step 5: Generate Pharmacy Request
        print("\n[STEP 5/5] Generating Pharmacy Prescription Request...")
        pharmacy_generator = PharmacyRequestGenerator()
        pharmacy_requisition = pharmacy_generator.generate_pharmacy_request(soap_note, patient_data)
        print("✓ Pharmacy requisition generated")
        
        # Print all outputs as JSON
        print("\n" + "=" * 80)
        print("OUTPUT: PATIENT DEMOGRAPHICS")
        print("=" * 80)
        print(json.dumps(patient_data, indent=2))
        
        print("\n" + "=" * 80)
        print("OUTPUT: SOAP NOTE")
        print("=" * 80)
        print(json.dumps(soap_note, indent=2))
        
        print("\n" + "=" * 80)
        print("OUTPUT: CLINICAL DATA (STRUCTURED)")
        print("=" * 80)
        print(json.dumps(clinical_data, indent=2))
        
        print("\n" + "=" * 80)
        print("OUTPUT: LAB TEST REQUISITION")
        print("=" * 80)
        print(json.dumps(lab_requisition, indent=2))
        
        print("\n" + "=" * 80)
        print("OUTPUT: PHARMACY PRESCRIPTION REQUEST")
        print("=" * 80)
        print(json.dumps(pharmacy_requisition, indent=2))
        
        # Save all outputs
        print("\n" + "=" * 80)
        print("SAVING FILES")
        print("=" * 80)
        
        output_dir = Path(__file__).parent / 'output'
        output_dir.mkdir(exist_ok=True)
        
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        
        files_saved = []
        
        # Save individual files
        with open(output_dir / f'patient_data_{timestamp}.json', 'w') as f:
            json.dump(patient_data, f, indent=2)
        files_saved.append(f'patient_data_{timestamp}.json')
        
        with open(output_dir / f'soap_note_{timestamp}.json', 'w') as f:
            json.dump(soap_note, f, indent=2)
        files_saved.append(f'soap_note_{timestamp}.json')
        
        with open(output_dir / f'clinical_data_{timestamp}.json', 'w') as f:
            json.dump(clinical_data, f, indent=2)
        files_saved.append(f'clinical_data_{timestamp}.json')
        
        with open(output_dir / f'lab_requisition_{timestamp}.json', 'w') as f:
            json.dump(lab_requisition, f, indent=2)
        files_saved.append(f'lab_requisition_{timestamp}.json')
        
        with open(output_dir / f'pharmacy_requisition_{timestamp}.json', 'w') as f:
            json.dump(pharmacy_requisition, f, indent=2)
        files_saved.append(f'pharmacy_requisition_{timestamp}.json')
        
        # Save complete record
        complete_record = {
            "metadata": {
                "generated_at": datetime.now().isoformat(),
                "pipeline_version": "1.0.0"
            },
            "patient_demographics": patient_data,
            "soap_note": soap_note,
            "clinical_data": clinical_data,
            "lab_requisition": lab_requisition,
            "pharmacy_requisition": pharmacy_requisition
        }
        
        with open(output_dir / f'complete_record_{timestamp}.json', 'w') as f:
            json.dump(complete_record, f, indent=2)
        files_saved.append(f'complete_record_{timestamp}.json')
        
        for filename in files_saved:
            print(f"✓ {filename}")
        
        print("\n" + "=" * 80)
        print("PIPELINE COMPLETED SUCCESSFULLY!")
        print("=" * 80)
        print(f"Total files saved: {len(files_saved)}")
        print(f"Output directory: {output_dir.absolute()}")
        
    except Exception as e:
        print("\n" + "=" * 80)
        print("ERROR OCCURRED")
        print("=" * 80)
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()