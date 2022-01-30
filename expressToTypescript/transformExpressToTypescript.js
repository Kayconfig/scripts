const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const argumentValue = (argumentName) => {
  const indexOfArgument = process.argv.findIndex((arg) => arg === argumentName);
  if (indexOfArgument < 0) {
    console.error(
      'Please use the  --foldername tag followed by the file name.'
    );
    process.exit(1);
  }
  const valueOfArgument = process.argv[indexOfArgument + 1];
  if (!valueOfArgument) {
    console.error('Please enter a valid foldername');
    process.exit(1);
  }

  return valueOfArgument;
};

const cleanUpFolderAndExit = (foldername) => {
  fs.rmdirSync(`./${foldername}`);
  process.exit(1);
};

const createExpressApp = (foldername) => {
  console.log('creating express app...');
  try {
    const stdout = execSync(`npx express-generator ${foldername} --git`);
    console.log(stdout.toString());
  } catch (error) {
    console.error('Error occurred:', error);
    cleanUpFolderAndExit(foldername);
  }
};

const changeExtensionToTs = (filepath) => {
  fs.renameSync(filepath, `${filepath.slice(0, -2)}ts`);
};

const processfilesAndFolders = (foldername) => {
  console.info('renaming js files...');
  try {
    const stdout = execSync(`ls ${foldername} `);
    const folders = [`./${foldername}/routes`];
    const files = stdout
      .toString()
      .split('\n')
      .filter((file) => file)
      .map((file) => `./${foldername}/${file}`);

    files.forEach((file) => {
      const stats = fs.statSync(file);
      if (stats.isFile() && path.extname(file) === '.js') {
        changeExtensionToTs(file);
      } else if (stats.isDirectory() && folders.includes(file)) {
        processfilesAndFolders(file);
      }
    });
    console.log('done renaming js files.');
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

const moveAppAndRoutesToSrc = (foldername) => {
  console.log('moving executable files and their folders to src folder...');
  try {
    const stdout = execSync(`ls ${foldername}`).toString();
    const filesToMove = ['app.ts', 'routes'].map(
      (file) => `./${foldername}/${file}`
    );
    const helperFolders = ['controllers', 'models'];
    fs.mkdirSync(`${foldername}/src`);
    //create helper folders
    helperFolders.forEach((folder) =>
      fs.mkdirSync(`${foldername}/src/${folder}`)
    );
    const files = stdout
      .toString()
      .split('\n')
      .filter((file) => file)
      .map((file) => `./${foldername}/${file}`)
      .forEach((file) => {
        if (filesToMove.includes(file))
          fs.renameSync(file, `${foldername}/src/${path.basename(file)}`);
      });
    console.log('done moving executable files.');
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

const initializeTypeScript = (foldername) => {
  console.log('setting up typescript...');
  try {
    const stdout = execSync(
      `cd ${foldername} && yarn add --dev typescript && yarn tsc --init --rootDir ./src --outDir ./dist`
    ).toString();
    console.log(stdout + '\ndone with typescript.');
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

const foldername = argumentValue('--foldername');
createExpressApp(foldername);
processfilesAndFolders(foldername);
moveAppAndRoutesToSrc(foldername);
initializeTypeScript(foldername);
