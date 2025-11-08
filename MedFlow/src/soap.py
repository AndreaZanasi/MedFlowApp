import os
from typing import Dict
from openai import OpenAI
from .prompt_loader import PromptLoader

class SOAPNoteGenerator:
    
    def __init__(self, api_key: str = None, prompts_file: str = None):
        self.api_key = api_key or os.getenv('OPENAI_API_KEY')
        if not self.api_key:
            raise ValueError("OpenAI API key required")
        
        self.client = OpenAI(api_key=self.api_key)
        self.prompt_loader = PromptLoader(prompts_file)
        self.config = self.prompt_loader.get_config('soap_note')
    
    def generate_soap_note(self, transcription: str) -> Dict[str, str]:
        if not transcription or len(transcription.strip()) < 10:
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
                max_tokens=self.config['max_tokens']
            )
            
            content = response.choices[0].message.content
            return self._parse_response(content)
            
        except Exception as e:
            raise Exception(f"Error generating SOAP note: {str(e)}")
    
    def _parse_response(self, response: str) -> Dict[str, str]:
        sections = {}
        current_section = None
        current_content = []
        
        for line in response.split('\n'):
            line = line.strip()
            if line.endswith(':') and line[:-1].upper() in ['SUBJECTIVE', 'OBJECTIVE', 'ASSESSMENT', 'PLAN']:
                if current_section:
                    sections[current_section] = '\n'.join(current_content).strip()
                current_section = line[:-1].lower()
                current_content = []
            elif current_section:
                current_content.append(line)
        
        if current_section:
            sections[current_section] = '\n'.join(current_content).strip()
        
        return sections
    
    def format_soap_note(self, soap_dict: Dict[str, str]) -> str:
        template = self.prompt_loader.get_prompt('templates', 'soap_note_output')
        
        return template.format(
            separator='='*50,
            subjective=soap_dict.get('subjective', 'Not documented'),
            objective=soap_dict.get('objective', 'Not documented'),
            assessment=soap_dict.get('assessment', 'Not documented'),
            plan=soap_dict.get('plan', 'Not documented')
        )