# Google AdSense & CMP Implementation Guidelines

## 1. Compliance Checklist for AdSense Readiness

RankNova is engineered to meet Google AdSense publisher policies:
- **Zero Deceptive Layouts:** Ad slots are separated from primary interactive controls (Analyze, Generate, Copy, Download) with distinct border styling and explicit "Advertisement" labels.
- **No Artificially Induced Clicks:** Users are never forced to click ads or view popups prior to accessing audit scores or generating schema.
- **Substantive Content:** Public routes include rich technical explanations, educational guides, methodology documentation, and transparent scoring weights.
- **Comprehensive Disclosures:** Complete Privacy Policy, Terms of Service, Disclaimer, and Contact pages are linked from the site footer.

## 2. Google-Certified CMP (EEA / UK / Switzerland)

Publishers serving ads to visitors in the European Economic Area, United Kingdom, and Switzerland must implement a Google-certified Consent Management Platform (CMP) integrated with the IAB Europe Transparency & Consent Framework (TCF v2.2).

### Activation Steps:
1. In the **Admin Dashboard** (`/admin`), verify `cmpEnabled: true`.
2. Insert your Google AdSense Publisher Client ID (format `ca-pub-XXXXXXXXXXXXXXXX`).
3. Deploy Google Funding Choices or your chosen certified CMP script directly into `index.html`.
4. Keep live ad scripts disabled until Google confirms your site review.
