import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from parent directory (MedFlow folder)
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

def main():
    sample_transcription = """
        Doctor: Good morning, what brings you in today?
        
        Patient: Hi doctor, I've been having really bad headaches for the past three days. 
        They're worse in the morning when I wake up.
        
        Doctor: I see. Any other symptoms? Fever, nausea, vision changes?
        
        Patient: No fever, but I do feel a bit nauseous sometimes. No vision problems though.
        
        Doctor: Have you been under any stress lately?
        
        Patient: Yes, actually. Work has been really hectic this month.
        
        Doctor: Okay, let me check your vitals. Your blood pressure is 120 over 80, 
        heart rate is 72, temperature is normal at 98.6. Let me do a quick neurological exam.
        Everything looks normal, no neck stiffness.
        
        Doctor: Based on what you've told me and the examination, this appears to be 
        tension-type headaches, likely related to stress.
        
        Patient: What should I do?
        
        Doctor: I recommend taking ibuprofen 400mg three times a day as needed for the pain. 
        Also, try to manage your stress - maybe some relaxation techniques or exercise. 
        If the headaches don't improve in a week, come back and we'll do further testing.
        
        Patient: Okay, thank you doctor.
        """
        
    try:
        from soap import SOAPNoteGenerator
        # Initialize generator
        generator = SOAPNoteGenerator()
        
        # Generate SOAP note
        print("Generating SOAP note...")
        soap_note = generator.generate_soap_note(sample_transcription)
        
        # Print formatted output
        formatted = generator.format_soap_note(soap_note)
        print(formatted)
        
        # Also print as JSON for API usage
        import json
        print("\nJSON Output:")
        print(json.dumps(soap_note, indent=2))
        
    except Exception as e:
        print(f"Error: {e}")


if __name__ == "__main__":
    main()