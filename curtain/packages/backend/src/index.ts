/*
 * Hi!
 *
 * Note that this is an EXAMPLE Backstage backend. Please check the README.
 *
 * Happy hacking!
 */

import { createBackend } from '@backstage/backend-defaults';
import { coreServices } from '@backstage/backend-plugin-api';
import { createBackendModule } from '@backstage/backend-plugin-api';
import { authProvidersExtensionPoint } from '@backstage/plugin-auth-node';
import { githubAuthenticator } from '@backstage/plugin-auth-backend-module-github-provider';
const backend = createBackend();
// auth plugin
backend.add(import('@backstage/plugin-auth-backend'));

/*
const githubSignInModule = createBackendModule({
  moduleId: 'github-signin-resolver',
  pluginId: 'auth',
  register(reg) {
    reg.registerInit({
      deps: { providers: authProvidersExtensionPoint },
      async init({ providers }) {
        providers.registerProvider({
          providerId: 'github',
          authenticator: githubAuthenticator,
          async resolve({ result: { fullProfile } }, ctx) {
            return ctx.signInWithCatalogUser({
              entityRef: { name: fullProfile.username! },
            });
          },
        });
      },
    });
  },
});*/
/*const githubSignInModule = createBackendModule({
  moduleId: 'github-signin-resolver',
  pluginId: 'auth',
  register(reg) {
    reg.registerInit({
      deps: { providers: authProvidersExtensionPoint },
      async init({ providers }) {
        providers.registerProvider({
          providerId: 'github',
          authenticator: githubAuthenticator,
          async resolve({ result: { fullProfile } }, ctx) {
	  try {
	    return await ctx.signInWithCatalogUser({
	      entityRef: { name: fullProfile.username! },
	    });
	  } catch (e) {
	    // FALLBACK: If user isn't in catalog, issue a token anyway for the demo
	    return ctx.issueToken({
	      claims: {
		sub: `user:default/${fullProfile.username}`,
		ent: [`user:default/${fullProfile.username}`],
	      },
	    });
	  }
          },
        });
      },
    });
  },
});*/

backend.add(import('@backstage/plugin-app-backend'));
backend.add(import('@backstage/plugin-proxy-backend'));

// scaffolder plugin
backend.add(import('@backstage/plugin-scaffolder-backend'));
backend.add(import('@backstage/plugin-scaffolder-backend-module-github'));

backend.add(
  import('@backstage/plugin-scaffolder-backend-module-notifications'),
);

// techdocs plugin
backend.add(import('@backstage/plugin-techdocs-backend'));


// See https://backstage.io/docs/backend-system/building-backends/migrating#the-auth-plugin
backend.add(import('@backstage/plugin-auth-backend-module-guest-provider'));
// See https://backstage.io/docs/auth/guest/provider

// catalog plugin
backend.add(import('@backstage/plugin-catalog-backend'));
backend.add(import('@backstage/plugin-catalog-backend-module-github'));
backend.add(import('@backstage/plugin-events-backend'));
backend.add(import('@backstage/plugin-events-backend-module-github'));
backend.add(
  import('@backstage/plugin-catalog-backend-module-scaffolder-entity-model'),
);

// See https://backstage.io/docs/features/software-catalog/configuration#subscribing-to-catalog-errors
backend.add(import('@backstage/plugin-catalog-backend-module-logs'));

// permission plugin
backend.add(import('@backstage/plugin-permission-backend'));
// See https://backstage.io/docs/permissions/getting-started for how to create your own permission policy
backend.add(
  import('@backstage/plugin-permission-backend-module-allow-all-policy'),
);

// search plugin
backend.add(import('@backstage/plugin-search-backend'));

// search engine
// See https://backstage.io/docs/features/search/search-engines
backend.add(import('@backstage/plugin-search-backend-module-pg'));

// search collators
backend.add(import('@backstage/plugin-search-backend-module-catalog'));
backend.add(import('@backstage/plugin-search-backend-module-techdocs'));

// kubernetes plugin
backend.add(import('@backstage/plugin-kubernetes-backend'));

// notifications and signals plugins
backend.add(import('@backstage/plugin-notifications-backend'));
backend.add(import('@backstage/plugin-signals-backend'));
//backend.add(githubSignInModule);
backend.add(import('@backstage/plugin-auth-backend-module-github-provider'));
/*backend.add(
  authProvidersExtensionPoint.createExtension({
    resolver: {
      providerId: 'github',
      authenticator: githubAuthenticator,
      async resolve({ result: { fullProfile } }, ctx) {
        // This "SignInResolver" creates a temporary user identity 
        // based on your GitHub username if you don't exist in the catalog.
        return ctx.signInWithCatalogUser({
          entityRef: { name: fullProfile.username! },
        });
      },
    },
  })
);*/

backend.start();
