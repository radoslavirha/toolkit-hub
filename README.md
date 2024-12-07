# Toolkit HUB

Toolkit Hub serves as a one-stop repository for all reusable and shareable libraries for my projects.

[Contributing guide](.github/CONTRIBUTING.md)

[Development guide](.github/development.md)

## Installing libraries

[GitHub docs](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry#installing-a-package)

- Create `.npmrc`
- Optionally add `@radoslavirha:registry=https://npm.pkg.github.com` to `.npmrc`
- [Retrieve personal access token](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry#authenticating-with-a-personal-access-token)
- Add `//npm.pkg.github.com/:_authToken=<TOKEN>` to `.npmrc`
- `.npmrc` should be excluded from git or leave there only registry and login manually
