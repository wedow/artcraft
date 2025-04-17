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

## Editor3d

Run dev server:

```bash
nx dev editor3d
```

```
call when starting on main or a new branch:
./clean_modules

The names for @frontend and @storyteller come from the package.json file in the libs folder.
import { Login } from "@frontend/login";
import { api } from "@storyteller/api";

building:
npx nx build editor3d
npx nx build editor2d

dev:
npx nx dev editor3d
npx nx dev editor2d
```


