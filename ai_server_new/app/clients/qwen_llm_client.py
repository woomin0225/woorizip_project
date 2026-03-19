# app/client/qwen_llm_client

from transformers import AutoModelForCausalLM, AutoTokenizer
import torch

import logging
logger=logging.getLogger(__name__)

class QwenLlmClient:
    def __init__(self, model_name: str = "Qwen/Qwen2.5-3B-Instruct"):
        self.model_name = model_name
        self.tokenizer = AutoTokenizer.from_pretrained(model_name)
        
        device = "cuda" if torch.cuda.is_available() else "cpu"
        dtype = torch.float16 if device == "cuda" else torch.float32
        
        self.model = AutoModelForCausalLM.from_pretrained(
            model_name,
            torch_dtype=dtype,
        ).to(device)
    
    def generate_from_messages(self, messages, max_new_tokens: int = 512, do_sample: bool = False, temperature: float = 0.2, top_p: float = 0.9):
        text = self.tokenizer.apply_chat_template(
            messages,
            tokenize=False,
            add_generation_prompt=True
        )
        model_inputs = self.tokenizer([text], return_tensors="pt").to(self.model.device)
        
        generate_kwargs = {
            "max_new_tokens": max_new_tokens,   # 환경에 따라 조절 ~512, 새로 생성할 최대 토큰 수(요약은 80~200추천)
            "do_sample": do_sample, # 확률적으로 샘플링하여 다음 토큰 선택. (False-안정적, 재현성 높음, 요약에서 주로 사용 / True-더 자연스럽거나, 다양해짐)
        }
        
        if do_sample:
            generate_kwargs["temperature"] = temperature    # 출력의 랜덤성 강도: 높을수록 창의적, 다양한 답변. do_sample=False이면 안써도됨
            generate_kwargs["top_p"] = top_p    # 다음 토큰 후보를 보는 정도: 높을수록 다양한 후보 허용. do_sample=False이면 안써도됨
        
        try:
            logger.info("qwen generate start")
            generated_ids = self.model.generate(
                **model_inputs,
                **generate_kwargs
            )
            logger.info("qwen generate done")
        except Exception:
            logger.exception("qwen generate failed")
            raise
        
        generated_ids = [
            output_ids[len(input_ids):] for input_ids, output_ids in zip(model_inputs.input_ids, generated_ids)
        ]

        response = self.tokenizer.batch_decode(generated_ids, skip_special_tokens=True)[0]
        
        return response
    
    