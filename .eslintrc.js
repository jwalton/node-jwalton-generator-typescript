module.exports = {
    parserOptions: {
        ecmaVersion: 8,
        sourceType: 'module',
        ecmaFeatures: {
            impliedStrict: true,
        },
    },
    env: {
        node: true,
        es6: true,
        mocha: true,
    },
    extends: [
        'eslint:recommended',
        'prettier',
        'plugin:promise/recommended',
        'plugin:import/recommended',
    ],
};
