module.exports = {
  rules: {
    'branch-name': [
      2,
      {
        format:
          /^(feature|publish|release|hotfix|develop|main)\/[a-z0-9._-]+$/,
      },
    ],
  },
};
