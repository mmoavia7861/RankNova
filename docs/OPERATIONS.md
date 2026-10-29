# RankNova Operations & Deployment Runbook

## 1. Local Development
```bash
# Install dependencies
npm install

# Run full-stack dev server (port 3000)
npm run dev

# Run security & schema unit tests
npm test

# Verify type safety
npm run lint
```

## 2. Cloud Run Production Deployment
RankNova is configured for zero/minimal fixed infrastructure cost with Cloud Run autoscaling:
- **Build Container:**
  ```bash
  gcloud builds submit --tag gcr.io/gen-lang-client-0081440357/ranknova
  ```
- **Deploy Service:**
  ```bash
  gcloud run deploy ranknova \
    --image gcr.io/gen-lang-client-0081440357/ranknova \
    --platform managed \
    --region asia-east1 \
    --allow-unauthenticated \
    --min-instances 0 \
    --max-instances 10 \
    --memory 512Mi \
    --timeout 15s \
    --concurrency 80
  ```

## 3. Monitoring & Alerts
- Monitor Cloud Run metrics for 5xx error spikes or abnormal latency (>3000ms).
- Review `/api/health` with automated uptime monitors (e.g., Google Cloud Monitoring or UptimeRobot).
- Inspect audit rate limits in structured logs: requests exceeding 15 audits/min per IP return HTTP 429.

## 4. Rollback Procedure
If a production defect is identified:
```bash
gcloud run services rollback ranknova --region asia-east1
```
