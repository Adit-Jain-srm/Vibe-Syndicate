-- Fix Reviewer agent model label to reflect actual Azure OpenAI deployment
UPDATE agents SET model = 'gpt-4o (Azure)' WHERE role = 'reviewer';
