#!/usr/bin/env node

const deploymentTarget = process.env.POLICYWATCHER_DEPLOYMENT_TARGET?.trim().toLowerCase();

console.log(
  `Hostinger install phase${deploymentTarget ? ` for ${deploymentTarget}` : ''}: `
    + 'promotion validation is deferred to the target-specific build gate, '
    + 'and database initialization is deferred to the guarded runtime startup.',
);
