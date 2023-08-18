const core = require('@actions/core');
const exec = require('@actions/exec');
const fs = require('fs');

// create a async function to run the action
async function run() {
  try {
    let isInstall = !!core.getInput('is-install');
    // checkout
    await exec.exec('actions/checkout@v3', {
      args: ['--fetch-depth', '0']
    });

    // pnpm setup
    await exec.exec('pnpm/action-setup@v2',{
      args: ['--version', '7']
    });

    // Cache
    const cacheKey = `pnpm-dependencies-${core.hashFiles('**/pnpm-lock.yaml')}`;
    const cachePaths = ['~/.pnpm-store', 'node_modules', 'packages/**/node_modules']
    const cacheMethod = isInstall ? [] : ['restore']
    await exec.exec('actions/cache@v3', {
        args: [
          ...cacheMethod,
          '--key',
          cacheKey,
          '--path',
          cachePaths.join('\n'),
          '--restore-keys',
          'pnpm-dependencies-'
        ]
      });

    if(isInstall) {
      const _globals = core.getInput('globals');
      const environment = core.getInput('environment');
      let envContent = `${_globals}

${environment}`;

      // Write the .env file
      fs.writeFileSync('.env', envContent);
      console.log('.env file created successfully');
    } else {
      // download workflow artifact
      await exec.exec('actions/download-artifact@v3', {
        args: ['--name', 'workflow-envs']
      });
    }

    // build stage
    const isBuild = core.getInput('is-build');
    if(isBuild) {
      await exec.exec(`cp .env packages/${isBuild}/.env`);
      await exec.exec(`pnpm -F @growrk/${isBuild} build`);

      // upload build artifact
      await exec.exec(`tar -czvf ${isBuild}.tar.gz packages/${isBuild}/.nuxt packages/${isBuild}/.output`);
      await exec.exec('actions/upload-artifact@v3', {
        args: ['--name', `build-${isBuild}`, `${isBuild}.tar.gz`]
      });
    }

    // deploy stage
    const isDeploy = core.getInput('is-deploy');
    if(isDeploy) {
      await exec.exec('actions/download-artifact@v3', {
        args: ['--name', `build-${isDeploy}`]
      })
      await exec.exec(`tar -xzvf ${isDeploy}.tar.gz -C packages/${isDeploy}/ --strip-components=2`);
    }

    // done
    console.log('Done');
  } catch (error) {
    core.setFailed(error.message);
  }
}

run().then(() => {
  process.exit(0);
})
