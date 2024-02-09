#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';
import path from 'path';
import readline from 'readline';
import chalk from 'chalk';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log(chalk.blue("============================================================"));
console.log(chalk.blueBright(chalk.bold("                Welcome to json-resumify")));
console.log(chalk.blue("============================================================"));
console.log(chalk.yellow("Make an interactive, printable, minimalistic nice looking web resume in seconds!"));
console.log(chalk.yellow("You will just take care of a single .json file, let json-resumify do the rest."));
console.log(chalk.yellow("Enter a custom name or press Enter to use the default name."));
console.log("");

rl.question("Enter the directory name for the project... (json-resumify) ", async (answer) => {
  let  directoryName = answer.trim();
  directoryName = sanitizeDirectoryName(directoryName);
  // Default value in case directory name is empty
  directoryName = directoryName || 'json-resumify';

  // Construct the Astro command
  const args = `${directoryName} --template basics --typescript strict --no-install --no-git`;
  const astroCommand = `npm create astro@latest -- ${args}`;

  console.log(chalk.yellow("Initializing project..."));
  try {
    // Execute Astro command to build the skaffold
    execSync(astroCommand, { stdio: 'inherit', shell: true });
    console.log(chalk.green("Project initialized successfully!"));
    console.log("");
  } catch (error) {
    console.error(chalk.red(`Error executing command: ${error.message}`));
    process.exit(1);
  }

  const filesToModify = [
    { path: path.join(directoryName, 'tsconfig.json'), content: readContentFromFile('tsconfig.json.content')},
    { path: path.join(directoryName, 'src', 'pages', 'index.astro'), content: readContentFromFile('index.astro.content')},
    { path: path.join(directoryName, 'src', 'layouts', 'Layout.astro'), content: readContentFromFile('Layout.astro.content')},
  ];
  const filesToCreate = [
    { path: path.join(directoryName, 'src', 'cv.json'), content: readContentFromFile('cv.json.content')},
    { path: path.join(directoryName, 'src', 'components', 'Section.astro'), content: readContentFromFile('Section.astro.content')},
    { path: path.join(directoryName, 'src', 'components', 'KeyboardManager.astro'), content: readContentFromFile('KeyboardManager.astro.content')},
    { path: path.join(directoryName, 'src', 'components', 'sections', 'About.astro'), content: readContentFromFile('About.astro.content')},
    { path: path.join(directoryName, 'src', 'components', 'sections', 'Education.astro'), content: readContentFromFile('Education.astro.content')},
    { path: path.join(directoryName, 'src', 'components', 'sections', 'Experience.astro'), content: readContentFromFile('Experience.astro.content')},
    { path: path.join(directoryName, 'src', 'components', 'sections', 'Hero.astro'), content: readContentFromFile('Hero.astro.content')},
    { path: path.join(directoryName, 'src', 'components', 'sections', 'Projects.astro'), content: readContentFromFile('Projects.astro.content')},
    { path: path.join(directoryName, 'src', 'components', 'sections', 'Skills.astro'), content: readContentFromFile('Skills.astro.content')},
    { path: path.join(directoryName, 'src', 'icons', 'GitHub.astro'), content: readContentFromFile('GitHub.astro.content')},
    { path: path.join(directoryName, 'src', 'icons', 'LinkedIn.astro'), content: readContentFromFile('LinkedIn.astro.content')},
    { path: path.join(directoryName, 'src', 'icons', 'Mail.astro'), content: readContentFromFile('Mail.astro.content')},
    { path: path.join(directoryName, 'src', 'icons', 'Phone.astro'), content: readContentFromFile('Phone.astro.content')},
    { path: path.join(directoryName, 'src', 'icons', 'WorldMap.astro'), content: readContentFromFile('WorldMap.astro.content')},
  ];
  const filesToRemove = [
    { path: path.join(directoryName, 'src', 'components', 'Card.astro') }
  ];

  console.log(chalk.yellow("Installing packages and generating the template..."));
  try {
    // Move to the project's directory and install packages
    execSync(`cd ${directoryName} && npm i ninja-keys`, { stdio: 'inherit', shell: true });
    console.log(chalk.green("Packages installed successfully!"));
    await performFileOperations();
  } catch (error) {
    console.error(chalk.red(`Error executing command: ${error.message}`));
    process.exit(1);
  }

  try {
    execSync(`cd ${directoryName} && npm run astro preferences disable devToolbar`, { stdio: 'inherit', shell: true });
  } catch (error) {
    console.error(chalk.red(`Error executing command: ${error.message}`));
    process.exit(1);
  }

  displayNextSteps();

  async function performFileOperations() {
    // Create each new file from the filesToCreate array
    for (const { path, content } of filesToCreate) {
      await modifyFile(path, content);
    }
    // Modify files from the filesToModify array
    await traverseDir(directoryName, filesToModify);
    // Remove each file from the filesToRemove array
    for (const { path } of filesToRemove) {
      removeFile(path);
    }
  }
  
  function displayNextSteps() {
    console.log("");
    console.log("");
    console.log(chalk.bgGreen(chalk.bold('NEXT STEPS')));
    console.log(`Navigate to ${directoryName} using ${chalk.dim(chalk.blueBright(`cd ${directoryName}`))}`);
    console.log(`Start the project using ${chalk.dim(chalk.blueBright('npm run dev'))}`);
    console.log(`Go to ${chalk.blueBright('http://localhost:4321')} on your browser`);
    console.log(`Go to ${chalk.bgGreen('src/cv.json')} and editing the file with your data`);
    console.log(chalk.bold(chalk.green('Just take care of that json file, the rest its already done!')));
    console.log(chalk.dim("Using Astro - https://astro.build/"));
    console.log(chalk.dim("Inspired by JSON Resume - https://jsonresume.org/"));
    console.log(chalk.dim("Inspired by MiduDev - https://midu.dev/"));
    console.log("");
    console.log(chalk.blue("============================================================"));
    console.log(chalk.blue(chalk.bold("      Thanks for using json-resumify, and good luck!")));
    console.log(chalk.blue("============================================================"));
    rl.close();
  }
});

// Function to sanitize the directory name input
function sanitizeDirectoryName(input) {
  if (input) {
    // Define a regular expression to match invalid characters for directory names
    const invalidCharsRegex = /[<>:"\/\\|?*]/g;

    // Remove invalid characters from the input
    return input.replace(invalidCharsRegex, '').replace(/\s+/g, '_');
  }
  return '';
}

function readContentFromFile(fileName) {
  // Get the directory path of the current module file
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  // Construct the absolute path to the fileContents directory
  const fileContentsPath = path.join(__dirname, 'fileContents');
  // Construct the absolute path to the specific file
  const filePath = path.join(fileContentsPath, fileName);

  try {
    // Read the file synchronously and return its content
    return readFileSync(filePath, 'utf8');
  } catch (error) {
    console.error(chalk.red('Error reading file:', error));
    return null; // Return null or handle the error accordingly
  }
}

// Function to recursively traverse directories
async function traverseDir(directory, filesToModify) {
  const files = await new Promise((res, rej) => {
    fs.readdir(directory, (err, files) => {
          if (err) {
              console.error(chalk.red('Error reading directory:', err));
              rej(err);
          } else {
            res(files);
          }
    });
  });
  
  for (const file of files) {
    const filePath = path.join(directory, file);
    const stats = await new Promise((res, rej) => {
      fs.stat(filePath, (err, stats) => {
        if (err) {
            console.error(chalk.red('Error stating file:', err));
            rej(err);
        } else {
          res(stats);
        }
      });
    });
    
    if (stats.isDirectory()) {
        // If it's a directory, recursively traverse it
        await traverseDir(filePath, filesToModify);
    } else if (stats.isFile()) {
      // If it's a file and its path is in the list of files to modify
      const fileToModify = filesToModify.find(fileObj => fileObj.path === filePath);
      if (fileToModify) {
          await modifyFile(filePath, fileToModify.content, true);
      }
    }
  }
}

// Function to modify the content of a file or create a new file with content
async function modifyFile(filePath, newContent, traversed = false) {
  // Extract the directory path from the file path
  const directoryPath = path.dirname(filePath);

  // Ensure that the directory exists, create it if it doesn't
  fs.mkdir(directoryPath, { recursive: true }, (err) => {
      if (err) {
          console.error(chalk.red('Error creating directory:', err));
          return;
      }

      // Write the new content to the file, overwriting existing content or creating a new file
      fs.writeFile(filePath, newContent, 'utf8', (err) => {
          if (err) {
              console.error(chalk.red('Error writing to file:', err));
              return;
          }

          if (!traversed) console.log(chalk.green('File modified successfully:'), filePath);
      });
  });
}

// Function to remove a file
function removeFile(filePath) {
  try {
    // Use fs.unlinkSync() to remove the file
    fs.unlinkSync(filePath);
    console.log(chalk.green('File removed successfully:'), filePath);
  } catch (error) {
    console.error(chalk.red(`Error removing file ${filePath}: ${error.message}`));
  }
}