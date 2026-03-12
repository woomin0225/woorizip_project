from kiwipiepy import Kiwi
import emoji
from langchain_text_splitters import RecursiveCharacterTextSplitter

def chunking(text, tokenizer):
        # 이모지 처리
        text = emoji.demojize(text, language="ko")

        # 형태소 분해 전처리 - kiwipiepy
        kiwi = Kiwi()
        result = kiwi.split_into_sents(text)

        sent_result = [s.text.strip() for s in result if s.text.strip()]
        normalized = "\n".join(sent_result)

        # chunking 준비 - langchain-text-splitters
        tokenizer = tokenizer

        splitter = RecursiveCharacterTextSplitter.from_huggingface_tokenizer(
            tokenizer=tokenizer,
            chunk_size=300,
            chunk_overlap=60
        )

        chunked = splitter.split_text(normalized)

        return chunked