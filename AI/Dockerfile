# Dockerfile for FastAPI AI backend
FROM python:3.10-slim  

# ثبّت حاجات النظام الضرورية ف
WORKDIR /app

# ١. انسخ requirements أولاً (لتحسين الـ caching)
COPY requirements.txt .

# ٢. استخدم mirror أسرع لـ pip (الصين أو خليجي)
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple

# ٣. انسخ باقي الملفات
COPY . .

EXPOSE 8000

CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8000"]