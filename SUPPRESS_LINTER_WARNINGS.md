# How to Suppress Linter Warnings in GitHub Actions Workflows

## The Issue

The linter shows warnings like:
```
Context access might be invalid: DATABASE_URL
```

These are **false positives** - the secrets are valid GitHub Actions syntax, but the linter can't verify they exist in repository settings.

## Solutions (Choose One)

### Solution 1: Install GitHub Actions Extension (Recommended)

The best solution is to install the official GitHub Actions extension in VS Code:

1. **Install Extension**:
   - Open VS Code
   - Go to Extensions (Ctrl+Shift+X)
   - Search for "GitHub Actions"
   - Install the official extension by GitHub

2. **Why This Works**:
   - The extension understands GitHub Actions syntax
   - It knows that `secrets.*` is valid
   - It won't show false positive warnings

### Solution 2: Configure VS Code Settings

The `.vscode/settings.json` file is already configured. If warnings persist:

1. **Reload VS Code**: Press `Ctrl+Shift+P` → "Reload Window"
2. **Check Extension**: Make sure "YAML" extension by Red Hat is installed
3. **Check Extension**: Make sure "GitHub Actions" extension is installed

### Solution 3: Add to VS Code Workspace Settings

If you want to suppress warnings for this workspace only, add to `.vscode/settings.json`:

```json
{
  "yaml.schemas": {
    "https://json.schemastore.org/github-workflow.json": ".github/workflows/*.yml"
  },
  "yaml.customTags": [
    "!And",
    "!If",
    "!Not",
    "!Equals"
  ],
  "[yaml]": {
    "editor.defaultFormatter": "redhat.vscode-yaml",
    "editor.formatOnSave": false
  },
  "files.associations": {
    ".github/workflows/*.yml": "github-actions-workflow"
  }
}
```

### Solution 4: Use actionlint (Command Line)

If you want a better linter that understands GitHub Actions:

```bash
# Install actionlint
npm install -g @github/actionlint

# Or use npx
npx @github/actionlint .github/workflows/deploy-production.yml
```

This linter understands GitHub Actions better and won't show false positives.

### Solution 5: Ignore the Warnings (Simplest)

**These warnings are safe to ignore**. They don't affect functionality:
- ✅ The workflow will run correctly
- ✅ Secrets will work when configured
- ✅ The syntax is valid
- ⚠️ The linter just can't verify secrets exist (by design)

## Verification

To verify your workflow is correct:

1. **Check GitHub Actions**: The workflow will run successfully if secrets are configured
2. **Test syntax**: Use GitHub's workflow editor (it validates correctly)
3. **Manual trigger**: Use `workflow_dispatch` to test

## Required Secrets

Make sure these are configured in GitHub:
- `DATABASE_URL`
- `DIRECT_URL`
- `NEXTAUTH_SECRET`
- `JWT_SECRET`
- `DEV_DATABASE_URL` (optional)
- `PROD_DATABASE_URL` (optional)

## Summary

**Best Approach**: Install the GitHub Actions extension in VS Code. It understands the syntax and won't show false positives.

**Quick Fix**: Ignore the warnings - they're false positives and don't affect functionality.

**Alternative**: Use `actionlint` command-line tool for better validation.

---

**Status**: The workflow is correct. The warnings are informational only. ✅
