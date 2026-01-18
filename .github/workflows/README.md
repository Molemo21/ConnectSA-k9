# GitHub Actions Workflows

## Linter Warnings

If you see warnings about "Context access might be invalid" for `secrets.*` in workflow files, **these are false positives** and can be safely ignored.

### Why These Warnings Appear

The YAML linter can't verify that GitHub Actions secrets exist because:
- Secrets are stored in repository settings, not in code
- The linter doesn't have access to repository settings
- It's a security feature - secrets shouldn't be visible to linters

### Are They Safe to Ignore?

**Yes!** These warnings are informational only. The workflow will work correctly as long as:
1. Secrets are configured in GitHub repository settings
2. The syntax is correct (which it is)

### How to Verify Secrets Are Configured

1. Go to your repository on GitHub
2. Navigate to: **Settings → Secrets and variables → Actions**
3. Verify these secrets exist:
   - `DATABASE_URL`
   - `DIRECT_URL`
   - `NEXTAUTH_SECRET`
   - `JWT_SECRET`
   - `DEV_DATABASE_URL` (optional, for reference data promotion)
   - `PROD_DATABASE_URL` (optional, for reference data promotion)

### Suppressing Warnings in VS Code

If you're using VS Code, install the "GitHub Actions" extension. It understands GitHub Actions syntax better and will suppress these false positives.

The `.vscode/settings.json` file is configured to help suppress these warnings.

---

**Bottom line**: These warnings are safe to ignore. Your workflow is correct! ✅
