# Deployment Ready Checklist

## Environment Variables Required

Set the following environment variables before deployment:

```bash
# API Keys
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
PERPLEXITY_API_KEY=YOUR_PERPLEXITY_API_KEY

# Configuration
OSRM_URL=http://router.project-osrm.org
FAISS_INDEX_PATH=./faiss_index
```

## Deployment Steps

1. Set up environment variables
2. Run database migrations if needed
3. Deploy to production server
4. Test all endpoints
5. Monitor logs and performance

## Security Notes

- Never commit API keys to version control
- Use environment variables for sensitive data
- Rotate API keys regularly
- Monitor for unauthorized access
