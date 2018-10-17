'use strict';
const path = require('path');
const ld = require('lodash');
const Generator = require('yeoman-generator');
const chalk = require('chalk');
const askNpmName = require('inquirer-npm-name');
const mkdirp = require('mkdirp');

const PACKAGES = [
    '@types/chai',
    '@types/mocha',
    'chai',
    'chai-as-promised',
    'coveralls',
    'markdownlint',
    'markdownlint-cli',
    'mocha',
    'nyc',
    'ts-node',
    'tslint',
    'typescript',
    'semantic-release',
    'validate-commit-msg',
    'husky'
];

const TEMPLATES = [
    '@types/README',
    'src/index.ts',
    'test/mocha.opts',
    'test/test.ts',
    'test/tsconfig.json',
    'test/tslint.json',
    {from: 'gitattributes', to: '.gitattributes'},
    {from: 'gitignore', to: '.gitignore'},
    '.markdownlint.json',
    '.nycrc',
    '.travis.yml',
    'CONTRIBUTING.md',
    'package.json',
    'README.md',
    'tsconfig.json',
    'tslint.json'

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
        Object.assign(this.props, await askNpmName({
            name: 'npmName',
            message: 'Your project npm name',
            default: makeNpmName(path.basename(process.cwd())),
            filter: makeNpmName
        }, this));

        Object.assign(this.props, await this.prompt([
            {
                type: 'input',
                name: 'githubUser',
                message: 'Github user name/org name',
                default: `jwalton`
            }, {
                type: 'input',
                name: 'githubProjectName',
                message: 'Github project name',
                default: `${this.props.npmName}`
            }, {
                name: 'projectDescription',
                message: 'Project description'
            }, {
                name: 'keywords',
                message: 'Package keywords (comma to split)',
                filter(words) {
                  return words.split(/\s*,\s*/g);
                }
            }, {
                type: 'input',
                name: 'authorName',
                message: 'Author\'s name',
                default: this.user.git.name(),
                store: true
            }, {
                type: 'input',
                name: 'authorEmail',
                message: 'Author\'s email address',
                default: this.user.git.email(),
                store: true
            }, {
                name: 'authorUrl',
                message: "Author's Homepage",
                store: true
            }, {
                type: 'input',
                name: 'minNodeVersion',
                message: 'Minimum version of node to support',
                default: '6',
                validate(str) {
                    const minNodeVersion = parseInt(str, 10);
                    if(isNaN(minNodeVersion)) {
                        return 'Value must be an integer (e.g. 6, 8, 10).';
                    }
                    return true;
                },
                store: true
            }
        ]));

        const minNodeVersion = parseInt(this.props.minNodeVersion, 10);
        if(minNodeVersion < 8) {
            this.props.typescriptTarget = 'es2016';
            this.props.typescriptLib = '["es2016"]';
        } else if(minNodeVersion < 10) {
            this.props.typescriptTarget = 'es2017';
            this.props.typescriptLib = '["es2016", "es2017.TypedArrays"]';
        } else {
            this.props.typescriptTarget = 'es2018';
            this.props.typescriptLib = '["es2016", "es2017", "es2018"]';
        }

        this.props.githubProject = `${this.props.githubUser}/${this.props.githubProjectName}`;
        this.props.year = (new Date()).getFullYear();
        this.props.keywords = this.props.keywords
            ? `[\n      "${this.props.keywords.map(s => s.trim()).join('",\n      "')}"\n    ]`
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
        for(const template of TEMPLATES) {
            this.fs.copyTpl(
                this.templatePath(template.from || template),
                this.destinationPath(template.to || template),
                this.props
            );
        }
    }

    install() {
        this.npmInstall(PACKAGES, { 'save-dev': true });
        this.installDependencies({
            npm: true,
            yarn: false,
            bower: false
        });
    }

    end() {
        this.spawnCommandSync('git', ['init', '--quiet'], {
            cwd: this.destinationPath()
        });

        const repoSSH = `git@github.com:${this.props.githubProject}.git`;
        this.spawnCommandSync('git', ['remote', 'add', 'origin', repoSSH], {
            cwd: this.destinationPath()
        });

        this.log('');
        this.log('All done!  Check README.md for a list of things to do to finish up.');
        this.log('');
    }
};
