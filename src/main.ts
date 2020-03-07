// Copyright (c) 2020 Luca Cappa
// Released under the term specified in file LICENSE.txt
// SPDX short identifier: MIT

import * as setShellEnv from './set-shell-env'

// Main entry point of the action.
setShellEnv.main().catch((error) => console.log(error));