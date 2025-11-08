import os
import json
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
        from data_extractor import SOAPDataExtractor
        
        # Initialize generator
        print("=" * 60)
        print("STEP 1: Generating SOAP Note")
        print("=" * 60)
        generator = SOAPNoteGenerator()
        
        # Generate SOAP note
        soap_note = generator.generate_soap_note(sample_transcription)
        
        # Print formatted SOAP note
        formatted = generator.format_soap_note(soap_note)
        print(formatted)
        
        # Print SOAP note as JSON
        print("\nSOAP Note JSON:")
        print(json.dumps(soap_note, indent=2))
        
        # Initialize extractor
        print("\n" + "=" * 60)
        print("STEP 2: Extracting Structured Data from SOAP Note")
        print("=" * 60)
        extractor = SOAPDataExtractor()
        
        # Extract data from SOAP note
        extracted_data = extractor.extract_data(soap_note)
        
        # Print formatted extracted data
        print("\nExtracted Data (Formatted):")
        print("-" * 60)
        formatted_data = extractor.format_extracted_data(extracted_data)
        print(formatted_data)
        
        # Print extracted data as JSON
        print("\n" + "-" * 60)
        print("Extracted Data (JSON):")
        print(json.dumps(extracted_data, indent=2))
        
        # Extract only numeric values
        print("\n" + "-" * 60)
        print("Numeric Values Only:")
        numeric_data = extractor.get_all_numeric_values(extracted_data)
        for key, value in numeric_data.items():
            if isinstance(value, dict) and 'value' in value and 'unit' in value:
                print(f"  • {key}: {value['value']} {value['unit']}")
            else:
                print(f"  • {key}: {value}")
        
        print("\n" + "=" * 60)
        print("Processing Complete!")
        print("=" * 60)
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()