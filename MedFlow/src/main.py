import json
from pathlib import Path
from dotenv import load_dotenv
from datetime import datetime

env_path = Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

def main():
    comprehensive_transcription = """
    Doctor: Good afternoon! Let me start by confirming your information. Your full name?
    
    Patient: Michael Robert Chen.
    
    Doctor: And date of birth?
    
    Patient: June 22nd, 1965. I just turned 59 last month.
    
    Doctor: Perfect. Current address is 789 Maple Avenue, Unit 12, Boston, Massachusetts, 02118?
    
    Patient: Yes, that's correct.
    
    Doctor: Phone number 617-555-8901, and email michael.chen@email.com?
    
    Patient: Yes, both are current.
    
    Doctor: I see you have Aetna insurance, policy ABC987654321, group number GRP-7788. Still active?
    
    Patient: Yes, through my company. I work as a software engineer at TechCorp.
    
    Doctor: Great. Your patient ID is PT-2024-9921. Now let me review your medical history. 
    You're allergic to sulfa drugs and latex, correct?
    
    Patient: Yes, sulfa drugs give me a severe rash, and latex causes hives.
    
    Doctor: Current medications - you're taking Atorvastatin 40mg at bedtime for cholesterol, 
    Metoprolol 50mg twice daily for your heart, and Levothyroxine 100mcg in the morning for thyroid?
    
    Patient: That's right. I also take fish oil supplements and vitamin D.
    
    Doctor: Any surgeries in your past?
    
    Patient: I had a knee arthroscopy 5 years ago for a torn meniscus, and my gallbladder 
    removed about 10 years ago.
    
    Doctor: Family history - I see your father had a heart attack at 62?
    
    Patient: Yes, and my mother has type 2 diabetes. My older brother also has high cholesterol.
    
    Doctor: Do you smoke or use alcohol?
    
    Patient: Never smoked. I have 2-3 beers on weekends, nothing excessive.
    
    Doctor: Good. Let me get your vitals. Blood pressure is 138 over 88, a bit high. 
    Heart rate 76 beats per minute, regular rhythm. Temperature 98.6 Fahrenheit. 
    Respiratory rate 16 breaths per minute. Oxygen saturation 98% on room air. 
    You're 5 feet 10 inches tall, weight is 210 pounds, BMI is 30.1.
    
    Doctor: What brings you in today?
    
    Patient: I've been having chest discomfort for the past week, maybe 5-6 days. 
    It's not constant, but it comes and goes, especially when I'm stressed at work or exercising.
    
    Doctor: Can you describe the discomfort? Is it sharp, dull, pressure?
    
    Patient: It's more like pressure or tightness, right in the center of my chest. 
    Sometimes it radiates to my left shoulder.
    
    Doctor: On a scale of 1 to 10?
    
    Patient: About a 5 or 6 when it happens.
    
    Doctor: How long does each episode last?
    
    Patient: Usually 5 to 10 minutes, then it goes away when I rest.
    
    Doctor: Any shortness of breath, sweating, nausea?
    
    Patient: Yes, I get a bit short of breath and sometimes feel lightheaded. 
    No nausea though.
    
    Doctor: This is concerning given your family history and risk factors. Let me examine you. 
    Heart sounds - regular rate and rhythm, I'm hearing a grade 2/6 systolic murmur at the apex. 
    Lungs are clear bilaterally. No peripheral edema. Carotid pulses are normal, no bruits. 
    Peripheral pulses are intact.
    
    Doctor: I'm also going to do an EKG right now... The EKG shows some nonspecific ST-T wave 
    changes in the lateral leads. Nothing acute, but concerning with your symptoms.
    
    Patient: What does that mean?
    
    Doctor: Based on your symptoms - exertional chest pressure radiating to the left shoulder, 
    lasting 5-10 minutes and relieved by rest, along with your family history, elevated BMI at 30.1, 
    borderline blood pressure at 138/88, and the EKG findings - I'm concerned about possible 
    stable angina or coronary artery disease.
    
    Doctor: The murmur I heard could be related, or it could be a separate issue. We also need 
    to evaluate your heart valves.
    
    Patient: That sounds serious. What do we do?
    
    Doctor: First, I need comprehensive testing. I'm ordering several things:
    
    For labs, I want a complete metabolic panel to check kidney and liver function, a lipid panel 
    to see your current cholesterol levels since you're on Atorvastatin, a hemoglobin A1c to 
    screen for diabetes given your family history, a complete blood count to check for anemia, 
    troponin levels to rule out any cardiac injury, a BNP level to assess heart function, 
    and thyroid function tests - TSH and free T4 - to make sure your Levothyroxine dose is correct.
    
    Doctor: For imaging and tests, I'm ordering a stress test - either a nuclear stress test or 
    stress echocardiogram - to evaluate blood flow to your heart during exercise. I also want 
    an echocardiogram at rest to look at your heart valves and function, and a chest X-ray to 
    rule out any lung issues.
    
    Doctor: I'm going to increase your Metoprolol from 50mg twice daily to 75mg twice daily 
    to better control your heart rate and blood pressure. Continue your Atorvastatin 40mg. 
    I'm also adding aspirin 81mg daily for cardiac protection.
    
    Doctor: I'm prescribing nitroglycerin 0.4mg sublingual tablets. If you have chest pain, 
    place one under your tongue. If the pain doesn't resolve in 5 minutes, take another. 
    If still no relief after the second dose in 5 more minutes, call 911 immediately.
    
    Patient: When should I get all these tests done?
    
    Doctor: The labs need to be done this week - you'll need to fast for 12 hours before, 
    so schedule it for first thing in the morning. The stress test and echocardiogram - 
    my office will call you within 2 days to schedule, hopefully within the next week. 
    The chest X-ray can be done today if you have time.
    
    Doctor: I also want you to see a cardiologist. I'm referring you to Dr. Sarah Williams 
    at Boston Cardiology Associates. Her office will contact you.
    
    Doctor: In the meantime, avoid strenuous exercise. Light walking is okay, but stop if you 
    have any chest discomfort. Reduce sodium to less than 2000mg per day. Avoid heavy meals. 
    Get adequate sleep. Try to minimize stress.
    
    Doctor: This is critical: if you have chest pain lasting more than 5 minutes that doesn't 
    respond to nitroglycerin, or if you have severe shortness of breath, severe dizziness, 
    or loss of consciousness, call 911 immediately. Don't drive yourself.
    
    Patient: I understand. This is scary, but I'm glad we're being thorough.
    
    Doctor: I know it's concerning, but we're catching this early and taking appropriate action. 
    I'll see you back here in one week to review all your test results. My office will call you 
    with the lab results in 2-3 days, and sooner if anything is critically abnormal.
    
    Patient: Thank you, Doctor. I appreciate your help.
    
    Doctor: You're welcome, Michael. Take care, and don't hesitate to call if anything changes 
    or you have questions. See you in a week.
    """
    
    try:
        from soap_generator_agent import SOAPNoteGenerator
        from data_extractor_agent import SOAPDataExtractor
        from patient_agent import PatientDataExtractor
        from lab_request_agent import LabRequestGenerator
        
        print("=" * 80)
        print("COMPREHENSIVE MEDICAL DOCUMENTATION PIPELINE")
        print("=" * 80)
        print(f"Timestamp: {datetime.now().isoformat()}")
        print("=" * 80)
        
        # Step 1: Extract Patient Data
        print("\n[STEP 1/4] Extracting Patient Demographics...")
        patient_extractor = PatientDataExtractor()
        patient_data = patient_extractor.extract_patient_data(comprehensive_transcription)
        print("✓ Patient data extracted")
        
        # Step 2: Generate SOAP Note
        print("\n[STEP 2/4] Generating SOAP Note...")
        soap_generator = SOAPNoteGenerator()
        soap_note = soap_generator.generate_soap_note(comprehensive_transcription)
        print("✓ SOAP note generated")
        
        # Step 3: Extract Clinical Data
        print("\n[STEP 3/4] Extracting Structured Clinical Data...")
        data_extractor = SOAPDataExtractor()
        clinical_data = data_extractor.extract_data(soap_note)
        print("✓ Clinical data extracted")
        
        # Step 4: Generate Lab Request
        print("\n[STEP 4/4] Generating Lab Test Requisition...")
        lab_generator = LabRequestGenerator()
        lab_requisition = lab_generator.generate_lab_request(soap_note, patient_data)
        print("✓ Lab requisition generated")
        
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
        
        # Save complete record
        complete_record = {
            "metadata": {
                "generated_at": datetime.now().isoformat(),
                "pipeline_version": "1.0.0"
            },
            "patient_demographics": patient_data,
            "soap_note": soap_note,
            "clinical_data": clinical_data,
            "lab_requisition": lab_requisition
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