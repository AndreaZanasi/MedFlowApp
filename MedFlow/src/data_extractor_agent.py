import os
import json
from typing import Dict, Any
from openai import OpenAI
from prompt_loader import PromptLoader

class SOAPDataExtractor:
    
    def __init__(self, api_key: str = None, prompts_file: str = None):
        self.api_key = api_key or os.getenv('OPENAI_API_KEY')
        if not self.api_key:
            raise ValueError("OpenAI API key required")
        self.client = OpenAI(api_key=self.api_key)
        self.prompt_loader = PromptLoader(prompts_file)
        self.config = self.prompt_loader.get_config('data_extraction')
    
    def extract_data(self, soap_note: str, preserve_structure: bool = True) -> Dict[str, Any]:
        if isinstance(soap_note, dict):
            soap_text = self._dict_to_text(soap_note)
        else:
            soap_text = soap_note
        
        if not soap_text or len(soap_text.strip()) < 10:
            raise ValueError("SOAP note too short")
        
        try:
            user_message = self.config['user_message_template'].format(
                soap_note=soap_text
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
            
            if preserve_structure:
                return self._clean_empty_fields(data)
            else:
                return data
            
        except json.JSONDecodeError as e:
            raise Exception(f"Failed to parse JSON response: {str(e)}")
        except Exception as e:
            raise Exception(f"Error extracting data: {str(e)}")
    
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
    
    def _dict_to_text(self, soap_dict: Dict[str, str]) -> str:
        return f"""
            SUBJECTIVE: {soap_dict.get('subjective', '')}
            OBJECTIVE: {soap_dict.get('objective', '')}
            ASSESSMENT: {soap_dict.get('assessment', '')}
            PLAN: {soap_dict.get('plan', '')}
        """
    
    def format_extracted_data(self, data: Dict[str, Any], indent: int = 0) -> str:
        output = []
        indent_str = "  " * indent
        
        for key, value in data.items():
            display_key = key.replace('_', ' ').title()
            
            if isinstance(value, dict):
                if 'value' in value and 'unit' in value:
                    if value['value'] is not None:
                        output.append(f"{indent_str}• {display_key}: {value['value']} {value['unit']}")
                else:
                    output.append(f"{indent_str}{display_key.upper()}:")
                    output.append(self.format_extracted_data(value, indent + 1))
                    
            elif isinstance(value, list):
                if len(value) > 0:
                    output.append(f"{indent_str}{display_key.upper()}:")
                    for item in value:
                        if isinstance(item, dict):
                            item_str = ", ".join([f"{k}: {v}" for k, v in item.items() if v])
                            output.append(f"{indent_str}  • {item_str}")
                        else:
                            output.append(f"{indent_str}  • {item}")
                            
            elif value is not None:
                output.append(f"{indent_str}• {display_key}: {value}")
        
        return "\n".join(output)
    
    def get_all_numeric_values(self, data: Dict[str, Any]) -> Dict[str, Any]:
        numeric_data = {}
        
        def extract_numeric(obj, prefix=""):
            if isinstance(obj, dict):
                if 'value' in obj and 'unit' in obj and obj['value'] is not None:
                    key = prefix.rstrip('.')
                    numeric_data[key] = obj
                else:
                    for k, v in obj.items():
                        new_prefix = f"{prefix}{k}." if prefix else f"{k}."
                        extract_numeric(v, new_prefix)
            elif isinstance(obj, list):
                for item in obj:
                    extract_numeric(item, prefix)
        
        extract_numeric(data)
        return numeric_data