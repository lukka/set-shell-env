[![build and tests](https://github.com/lukka/set-shell-env/workflows/build-test/badge.svg)](https://github.com/lukka/set-shell-env)

# [**set-shell-env** action ](https://github.com/marketplace/actions/run-cmake)

This action exports as GitHub's variables a subset of the shell environment variables (using a regex to include/exclude the whole set). You can create new ones in the `with:` section as well in the yml file. After its execution any environment variable is accessible by using `${{ env.<VARIABLENAME> }}` or `$VARIABLENAME`.

 ## User Manual
 * [Quickstart](#quickstart)
 * [Action reference: all input/output parameters](#reference)
 
 ## Developer Manual
 * [Developers information](#developers-information)
   * [Prerequisites](#prerequisites)
   * [Packaging](#packaging)
   * [Testing](#testing)
  * [Contributing](#contributing)
  * [License](#license)

## <a id='quickstart'>Quickstart</a>

```yaml
    - uses: lukka/set-shell-env@v0
      name: export all environment variable and ones defined in the 'with' section as well
      with:
        NEW_VAR_NAME: new_var_value
    # with:
    #   shell: 'bash' or 'tcsh' or any command that starts a shell .
    #   args: '-c env' or any arguments that list the environment variables as NAME=VALUE pairs.
    #   filter: the default include all but the "npm_*" ones.
    #   includeFilter: indicates if the filter includes or exclude variables.
    #   YOUR_VARIABLE_NAME: provide value for any new variable you name. Note the name will always be converted to be all uppercase.
    #  Here onward any following step can access any environment variable using:
    #  in your yml file:
    #     ${{ env.YOUR_VARIABLE_NAME }}
    - name: print $new_var_name
      run: |
        echo $NEW_VAR_NAME
      shell: bash
```

### <a id='reference'>Action reference: all input/output parameters</a>

[action.yml](https://github.com/lukka/set-shell-env/blob/v0/action.yml)

# Developers information

## Prerequisites
[gulp 4](https://www.npmjs.com/package/gulp4) globally installed.

## Build and lint
Build with `tsc` running:

 > npm run build

Launch `lint` by:

 > npm run lint

## Packaging
To build, lint validate and package the extension for release purpose, run:

  > npm run pack

## Testing

To build, pack and test:
 
 > npm run test

 To run test directly:
 
 > jest

## <a id='contributing'>Contributing</a>

The software is provided as is, there is no warranty of any kind. All users are encouraged to improve the [source code](https://github.com/lukka/set-shell-env) with fixes and new features.

# License
All the content in this repository is licensed under the [MIT License](LICENSE.txt).

Copyright (c) 2020 Luca Cappa
