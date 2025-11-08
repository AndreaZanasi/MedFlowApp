import json
import os
from pathlib import Path
from typing import Dict, Any


class PromptLoader:
    
    def __init__(self, prompts_file: str = None):

        if prompts_file is None:
            current_dir = Path(__file__).parent
            prompts_file = current_dir / "prompts.json"
        
        self.prompts_file = prompts_file
        self._prompts = self._load_prompts()
    
    def _load_prompts(self) -> Dict[str, Any]:
        try:
            with open(self.prompts_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        except FileNotFoundError:
            raise FileNotFoundError(f"Prompts file not found: {self.prompts_file}")
        except json.JSONDecodeError as e:
            raise ValueError(f"Invalid JSON in prompts file: {e}")
    
    def get_prompt(self, category: str, key: str) -> str:
        try:
            return self._prompts[category][key]
        except KeyError:
            raise KeyError(f"Prompt not found: {category}.{key}")
    
    def get_config(self, category: str) -> Dict[str, Any]:
        try:
            return self._prompts[category]
        except KeyError:
            raise KeyError(f"Category not found: {category}")
    
    def reload(self):
        self._prompts = self._load_prompts()