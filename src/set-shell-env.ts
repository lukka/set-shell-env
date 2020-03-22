// Copyright (c) 2020 Luca Cappa
// Released under the term specified in file LICENSE.txt
// SPDX short identifier: MIT

import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as execiface from '@actions/exec/lib/interfaces'
import { platform } from 'os';

export const actionName = 'set-shell-env';
export const shellInput = 'shell';
export const argsInput = 'args';
export const pathSeparatorInput = 'pathSeparator';
export const filterInput = 'filter';
export const includeFilterInput = 'includeFilter';

interface EnvVarMap { [key: string]: string };

function parseEnv(data: string): EnvVarMap {
  const map: EnvVarMap = {};
  const regex = {
    param: /^\s*([^=]+?)\s*=\s*(.*?)\s*$/,
  };
  const lines = data.split(/[\r\n]+/);
  for (const line of lines) {
    if (regex.param.test(line)) {
      const match = line.match(regex.param);
      if (match) {
        map[match[1]] = match[2];
      }
    }
  }

  return map;
}

function dumpEnvironment(): void {
  core.debug("dumpEnvironment()<<");
  for (const name in process.env) {
    core.debug(`${name}='${process.env[name]}'`);
  }
  core.debug("dumpEnvironment()>>");
}

export async function main(): Promise<void> {
  try {
    const shell = core.getInput(shellInput, { required: false }) ?? "bash";
    const args = core.getInput(argsInput, { required: false }) ?? "-c env";
    const defaultSeparator = platform.toString() === "win32" ? ";" : ":";
    const pathSeparator = core.getInput(pathSeparatorInput, { required: false }) ?? defaultSeparator;

    const filter = new RegExp(core.getInput(filterInput) ?? ".*");
    const includeFilter = core.getInput(includeFilterInput) ?? "true";
    const isIncludeFilter: boolean = includeFilter.toLowerCase() === 'true';

    dumpEnvironment();

    let stdout = "";
    let stderr = "";
    const options = {
      failOnStdErr: false,
      errStream: process.stdout,
      outStream: process.stdout,
      ignoreReturnCode: true,
      silent: false,
      windowsVerbatimArguments: false,
      env: process.env,
      listeners: {
        stdout: (data: Buffer): void => {
          stdout += data.toString();
        },
        stderr: (data: Buffer): void => {
          stderr += data.toString();
        }
      }
    } as execiface.ExecOptions;

    // Run the shell and get all the environment variables.
    const exitCode = await exec.exec(shell, args.split(" "), options);
    if (exitCode !== 0) {
      throw new Error(`${stdout}\n\n${stderr}`);
    }

    // Parse the output.
    const map = parseEnv(stdout);

    // Set the environment variables that are not excluded.
    for (const key in map) {
      if (filter.test(key) ? !isIncludeFilter : isIncludeFilter) {
        core.info(`Variable '${key}' is excluded by filter='${filter.toString()}'`);
      } else if (key.toUpperCase().startsWith("INPUT_")) {
        // Skip any INPUT_*, in order to avoid to set inputs for other tasks.
        const varName = key.replace(/^INPUT_/, '');
        const varValue = `${process.env[key]}`;
        core.exportVariable(varName, varValue);
        core.info(`Setting '${varName}' to "${varValue}"`);
      } else if (key.toUpperCase() === "PATH") {
        const path = (process.env[key] ?? "") + pathSeparator + map[key];
        core.exportVariable("PATH", path);
      } else {
        core.exportVariable(key, map[key]);
      }
    }

    dumpEnvironment();
    core.info(`${actionName} action execution succeeded`);
  }
  catch (err) {
    core.debug('Error: ' + err);
    core.setFailed(`${actionName} action execution failed`);
  }
}

