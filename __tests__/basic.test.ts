// Copyright (c) 2020 Luca Cappa
// Released under the term specified in file LICENSE.txt
// SPDX short identifier: MIT

import * as process from 'process'
import * as cp from 'child_process'
import * as path from 'path'
import * as core from '@actions/core';
import * as setShellEnv from '../src/set-shell-env';

describe('set-shell-env', () => {
    beforeEach(() => {
        Object.keys(process.env)
            .filter((key) => key.match(/^INPUT_/))
            .forEach((key) => {
                delete process.env[key];
            });
    });

    test('runs successfully', async () => {
        const options: cp.ExecSyncOptions = {
            env: process.env,
            stdio: "pipe"
        };

        process.env.INPUT_FILTER = ".*";
        process.env.INPUT_SHELL = "bash";
        process.env.INPUT_ARGS = "-c env";
        const scriptPath = path.join(__dirname, '..', 'dist', 'index.js');
        cp.execSync(`node ${scriptPath}`, options);
    });

    test('must export INPUT_* variables as env vars', async () => {
        const exportVariableMock = jest.spyOn(core, "exportVariable");

        process.env.INPUT_FILTER = ".*";
        process.env.INPUT_SHELL = "bash";
        process.env.INPUT_ARGS = "-c env";
        const varName = "CUSTOM_VARIABLE";
        const varValue = "I_AM_SPECIAL";
        process.env[`INPUT_${varName}`] = varValue;
        await setShellEnv.main();

        // Check all INPUT_ nor the filtered out have been exported.
        let customVarFound = false;
        for (let call of exportVariableMock.mock.calls) {
            if (call[0] === varName && call[1] === varValue)
                customVarFound = true;
        }
        expect(customVarFound).toBeTruthy();
    });

    test('must export variables according to include filter', async () => {
        const exportVariableMock = jest.spyOn(core, "exportVariable");

        process.env.__NOTMYVARIABLE__ = "notmyvariable";
        process.env.__MYVARIABLE__ = "myvariable";
        process.env.INPUT_FILTER = "__MYVARIABLE__";
        process.env.INPUT_SHELL = "bash";
        process.env.INPUT_ARGS = "-c env";
        process.env.INPUT_INCLUDEFILTER = 'true';
        await setShellEnv.main();

        expect(exportVariableMock).toHaveBeenCalledTimes(1);
        expect(exportVariableMock).toHaveBeenCalledWith('__MYVARIABLE__', 'myvariable');
    });

    test('must export variables according to exclude filter', async () => {
        const exportVariableMock = jest.spyOn(core, "exportVariable");

        const filter = "__MYVARIABLE__";
        const envVarCount = Object.keys(process.env).length;
        process.env.__MYVARIABLE__ = "myvariable";
        process.env.INPUT_FILTER = filter;
        process.env.INPUT_SHELL = "bash";
        process.env.INPUT_ARGS = "-c env";
        process.env.INPUT_INCLUDEFILTER = 'false';
        await setShellEnv.main();

        // Check all INPUT_ nor the filtered out have been exported.
        for (let call of exportVariableMock.mock.calls) {
            expect(call[0] != filter).toBeTruthy();
        }
    });
});