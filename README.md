# CyberSentinel AI

CyberSentinel AI is a security operations and risk intelligence dashboard designed to help teams understand cyber risk across their environment, prioritize the most important assets, and make smarter investment decisions.

This application presents a simulated security posture for an organization, making it easy to review asset exposure, identify critical gaps, and track remediation priorities without connecting to live production systems.

## What it does

CyberSentinel AI helps security and technology leaders:

- Monitor the risk profile of key assets across the environment
- View overall security posture through summary cards, trend charts, and risk distribution
- Identify the most vulnerable or high-impact assets based on a shared risk model
- Surface urgent security gaps and prioritized recommendations
- Review simulated recent security activity and operational events
- Compare security investments and expected reduction in risk over time

## Key features

### Risk overview
The dashboard provides a high-level summary of security health, including:
- total assets monitored
- critical exposure count
- average risk score
- current remediation posture

### Prioritized asset risk
Each asset is scored and ranked by risk severity, enabling security teams to focus on the assets most likely to cause business impact if compromised.

### Security gaps and recommendations
Users can inspect the top security issues, see which assets are affected, and review recommended actions that reduce exposure.

### Investment planning
The application includes an investment view that models how different security investments may reduce risk and improve resilience.

### Activity monitoring
A simulated activity log shows operational and security-related events so the platform feels like a real security command center.

## Tech stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- Recharts
- Lucide React

## Run locally

```bash
npm install
npm run dev
```

Then open http://localhost:3000 in your browser.

## Notes

This project is a demonstration dashboard using simulated data. It is designed to showcase a modern cyber risk intelligence workflow rather than connect to real security tooling or production infrastructure.
