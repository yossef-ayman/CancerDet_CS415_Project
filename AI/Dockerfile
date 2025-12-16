
FROM python:3.10-slim

ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

WORKDIR /app

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    build-essential \
    libgomp1 \
    && apt-get clean && \
    rm -rf /var/lib/apt/lists/*

COPY req.txt .


RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r req.txt

RUN adduser --system --no-create-home appuser
RUN mkdir -p /app/AI/ && chown appuser:appuser -R /app/AI/

COPY --chown=appuser:appuser . .

USER appuser

EXPOSE 8000

CMD ["gunicorn", "AI.server:app", \
     "--workers", "4", \
     "--worker-class", "uvicorn.workers.UvicornWorker", \
     "--bind", "0.0.0.0:8000"]