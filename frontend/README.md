# Frontend

This is an `nx` monorepo that can contain multiple apps and shared libraries.

All commands to run these projects are performed from _this_ directory.

## Install dependencies

```
npm install
```

## Editor2d

Run dev server:

```bash
nx dev editor2d
```

## artcraft

Run dev server:

```bash
nx dev artcraft
```

```
call when starting on main or a new branch:
./clean_modules

The names for @frontend and @storyteller come from the package.json file in the libs folder.
import { Login } from "@frontend/login";
import { api } from "@storyteller/api";

For shared UI components, import from @storyteller/ui-[componentname].
import { Button } from "@storyteller/ui-button";
import { Modal } from "@storyteller/ui-modal";

building:
npx nx build artcraft
npx nx build editor2d

dev:
npx nx dev artcraft
npx nx dev editor2d



# component build
1.
npx nx g @nx/react:library libs/components/toaster --import-path=@storyteller/ui-toaster --bundler=vite
npm install
2.import it first in code
3.nx sync
4.nx build

or

# frontend build
in frontend folder

% nx build -project type
% nx build artcraft
% nx dev artcraft
```
