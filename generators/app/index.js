'use strict';
const path = require('path');
const ld = require('lodash');
const Generator = require('yeoman-generator');
const chalk = require('chalk');
const askNpmName = require('inquirer-npm-name');
const mkdirp = require('mkdirp');
const _ = require('lodash');

const DEV_PACKAGES = {
    '@types/chai': '^4.2.21',
    '@types/mocha': '^9.0.0',
    '@types/node': '^16.4.13',
    '@typescript-eslint/eslint-plugin': '^4.29.1',
    '@typescript-eslint/parser': '^4.29.1',
    chai: '^4.3.4',
    'chai-as-promised': '^7.1.1',
    'chai-jest': '^1.0.2',
    eslint: '^7.32.0',
    'eslint-config-prettier': '^8.3.0',
    'eslint-plugin-import': '^2.24.0',
    husky: '^7.0.1',
    jest: '^27.0.6',
    'lint-staged': '^11.1.2',
    prettier: '^2.3.2',
    'pretty-quick': '^3.1.1',
    react: '^17.0.2',
    'semantic-release': '^17.4.4',
    'ts-jest': '^27.0.4',
    'ts-node': '^10.2.0',
    typescript: '^4.3.5',
    mocha: '^9.0.3',
    nyc: '^15.1.0',
};

const TEMPLATES = [
    '@types/README',
    'bin/build-types.sh',
    'src/index.ts',
    'test/test.ts',
    'test/tsconfig.json',
    'test/.eslintrc.js',
    { from: 'gitattributes', to: '.gitattributes' },
    { from: 'gitignore', to: '.gitignore' },
    { from: 'eslintrc.js', to: '.eslintrc.js' },
    '.nycrc',
    '.prettierrc.js',
    '.mocharc.js',
    'tsconfig.cjs.json',
    'tsconfig.json',
    'CONTRIBUTING.md',
    'package.json',
    'README.md',
    '.husky/pre-commit',
    '.github/workflows/github-ci.yaml',
    '.github/dependabot.yml',
];

function makeNpmName(name) {
    name = ld.kebabCase(name);
    return name;
}

module.exports = class extends Generator {
    async prompting() {
        // Have Yeoman greet the user.
        this.log(`Welcome to the groovy ${chalk.red('generator-jwalton-typescript')} generator!`);

        this.props = {};
        Object.assign(
            this.props,
            await askNpmName(
                {
                    name: 'npmName',
                    message: 'Your project npm name',
                    default: makeNpmName(path.basename(process.cwd())),
                    filter: makeNpmName,
                },
                this
            )
        );

        Object.assign(
            this.props,
            await this.prompt([
                {
                    type: 'input',
                    name: 'githubUser',
                    message: 'Github user name/org name',
                    default: `jwalton`,
                },
                {
                    type: 'input',
                    name: 'githubProjectName',
                    message: 'Github project name',
                    default: `${this.props.npmName}`,
                },
                {
                    name: 'projectDescription',
                    message: 'Project description',
                },
                {
                    name: 'keywords',
                    message: 'Package keywords (comma to split)',
                    filter(words) {
                        return words.split(/\s*,\s*/g);
                    },
                },
                {
                    type: 'input',
                    name: 'authorName',
                    message: "Author's name",
                    default: this.user.git.name(),
                    store: true,
                },
                {
                    type: 'input',
                    name: 'authorEmail',
                    message: "Author's email address",
                    default: this.user.git.email(),
                    store: true,
                },
                {
                    name: 'authorUrl',
                    message: "Author's Homepage",
                    store: true,
                },
                {
                    type: 'input',
                    name: 'minNodeVersion',
                    message: 'Minimum version of node to support',
                    default: '12',
                    validate(str) {
                        const minNodeVersion = parseInt(str, 10);
                        if (isNaN(minNodeVersion)) {
                            return 'Value must be an integer (e.g. 12, 14, 16).';
                        }
                        return true;
                    },
                    store: true,
                },
                {
                    type: 'boolean',
                    name: 'react',
                    message: 'Use React?',
                    default: false,
                },
            ])
        );

        const minNodeVersion = parseInt(this.props.minNodeVersion, 10);
        if (minNodeVersion < 8) {
            this.props.typescriptTarget = 'es2016';
            this.props.typescriptLib = '["es2016"]';
        } else if (minNodeVersion < 10) {
            this.props.typescriptTarget = 'es2017';
            this.props.typescriptLib = '["es2016", "es2017.TypedArrays"]';
        } else {
            this.props.typescriptTarget = 'es2018';
            this.props.typescriptLib = '["es2018"]';
        }

        this.props.githubProject = `${this.props.githubUser}/${this.props.githubProjectName}`;
        this.props.year = new Date().getFullYear();
        this.props.keywords = this.props.keywords
            ? `[\n      "${this.props.keywords.map((s) => s.trim()).join('",\n      "')}"\n    ]`
            : '[]';
        // To access props later use this.props.someAnswer;
    }

    default() {
        if (path.basename(this.destinationPath()) !== this.props.githubProjectName) {
            this.log(`Creating folder ${this.props.githubProjectName}.`);
            mkdirp(this.props.githubProjectName);
            this.destinationRoot(this.destinationPath(this.props.githubProjectName));
        } else {
            this.log(`Not creating folder ${this.props.githubProjectName}.`);
        }
    }

    writing() {
        this.addDevDependencies(DEV_PACKAGES);

        if (this.props.react) {
            this.addDevDependencies({
                '@types/react': '^17.0.0',
                '@types/react-dom': '^17.0.0',
            });
            this.addDependencies({
                react: '^17.0.0',
                'react-dom': '^17.0.0',
            });
        }

        for (const template of TEMPLATES) {
            this.fs.copyTpl(
                this.templatePath(template.from || template),
                this.destinationPath(template.to || template),
                this.props
            );
        }
    }

    end() {
        this.spawnCommandSync('git', ['init', '--quiet'], {
            cwd: this.destinationPath(),
        });

        const repoSSH = `git@github.com:${this.props.githubProject}.git`;
        this.spawnCommandSync('git', ['remote', 'add', 'origin', repoSSH], {
            cwd: this.destinationPath(),
        });

        this.log('');
        this.log('All done!  Check README.md for a list of things to do to finish up.');
        this.log('');
    }
};

_.extend(Generator.prototype, require('yeoman-generator/lib/actions/install'));
