# Stage 1: build React frontend
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
RUN npm run build

# Stage 2: Python backend + static files
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY api/ ./api/
COPY lib/ ./lib/
COPY --from=frontend-build /app/frontend/dist ./frontend/dist
EXPOSE 8000
CMD ["uvicorn", "api.index:app", "--host", "0.0.0.0", "--port", "8000"]
