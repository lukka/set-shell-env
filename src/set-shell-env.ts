// Copyright (c) 2020 Luca Cappa
// Released under the term specified in file LICENSE.txt
// SPDX short identifier: MIT

import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as execiface from '@actions/exec/lib/interfaces'
import { delimiter } from 'path'

export const actionName = 'set-shell-env';
export const shellInput = 'shell';
export const argsInput = 'args';
export const filterInput = 'filter';
export const includeFilterInput = 'includeFilter';

const excludedEnvVars: string[] = [shellInput, argsInput, filterInput, includeFilterInput, "path"];

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
    const shell = core.getInput(shellInput, { required: false }) || "bash";
    const args = core.getInput(argsInput, { required: false }) || "-c env";
    const filter = new RegExp(core.getInput(filterInput) || "^(?!npm_config.*$).*");
    const isIncludeFilter: boolean =
      (core.getInput(includeFilterInput) || "true").toLowerCase() === 'true';

    console.log(`shell=${shell}, args=${args}, filter=${filter}, isIncludeFilter=${isIncludeFilter}`);
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

    // Run the shell and get all the environment variables with the provided command.
    const exitCode = await exec.exec(shell, args.split(" "), options);
    if (exitCode !== 0) {
      throw new Error(`${stdout}\n\n${stderr}`);
    }

    // Parse the output.
    const map = parseEnv(stdout);

    // Set the environment variables that are not excluded.
    for (const key in map) {
      // Skip action inputs environment variables, and PATH as well.
      if (excludedEnvVars.includes(key.toLowerCase()))
        continue;
      if (filter.test(key) != isIncludeFilter) {
        core.info(`Variable '${key}' is excluded by filter='${filter}'`);
      } else if (key.toUpperCase().startsWith("INPUT_")) {
        // Drop the INPUT_ prefix and create a new variable with that name.
        const varName = key.replace(/^INPUT_/, '');
        const varValue = `${process.env[key]}`;
        core.exportVariable(varName, varValue);
        core.info(`Exporting custom variable '${varName}' to '${varValue}'`);
      } else {
        core.exportVariable(key, map[key]);
      }
    }

    dumpEnvironment();
    core.info(`${actionName} action execution succeeded`);
  }
  catch (err) {
    core.debug('Error: ' + err.toString());
    core.setFailed(`${actionName} action execution failed: ${err}`);
  }
}

