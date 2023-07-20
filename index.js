const core = require('@actions/core');
const fs = require('fs');

try {
  // Get input parameters
  const _globals = core.getInput('globals');
  const environment = core.getInput('environment');
  let envContent = `${_globals}

${environment}`;

  // Write the .env file
  fs.writeFileSync('.env', envContent);

  console.log('.env file created successfully');
} catch (error) {
  core.setFailed(error.message);
}
