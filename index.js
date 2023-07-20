const core = require('@actions/core');
const fs = require('fs');

try {
  // Get all the secrets in the environment
  const secrets = process.env;

  // Create the .env file
  let envContent = '';
  for (const secret in secrets) {
    if (secret.startsWith('SECRET_')) {
      envContent += `${secret}=${secrets[secret]}\n`;
    }
  }

  // Write the .env file
  fs.writeFileSync('.env', envContent);

  console.log('.env file created successfully');
} catch (error) {
  core.setFailed(error.message);
}
