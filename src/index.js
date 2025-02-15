#!/usr/bin/env node

const fs = require('fs');
const createInterface = require('./createInterface');
const createComponentInterface = require('./createComponentInterface');
const { pascalCase, isOptional } = require('./utils');

const args = process.argv.slice(2);
const isV5 = args.includes('--v5');

const typesDir = 'types';

if (!fs.existsSync(typesDir)) fs.mkdirSync(typesDir);

// --------------------------------------------
// Payload
// --------------------------------------------

const payloadTsInterface = `export interface Payload<T> {
  data: T;
  meta: {
    pagination?: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    }
  };
}
`;

fs.writeFileSync(`${typesDir}/Payload.ts`, payloadTsInterface);

// --------------------------------------------
// User
// --------------------------------------------

const userTsInterface = isV5
  ? `export interface User {
  documentId: number;
  username: string;
  email: string;
  provider: string;
  confirmed: boolean;
  blocked: boolean;
  createdAt: Date;
  updatedAt: Date;
}
`
  : `export interface User {
  id: number;
  attributes: {
    username: string;
    email: string;
    provider: string;
    confirmed: boolean;
    blocked: boolean;
    createdAt: Date;
    updatedAt: Date;
  }
}
`;

fs.writeFileSync(`${typesDir}/User.ts`, userTsInterface);

// --------------------------------------------
// MediaFormat
// --------------------------------------------

const mediaFormatTsInterface = `export interface MediaFormat {
  name: string;
  hash: string;
  ext: string;
  mime: string;
  width: number;
  height: number;
  size: number;
  path: string;
  url: string;
}
`;

fs.writeFileSync(`${typesDir}/MediaFormat.ts`, mediaFormatTsInterface);

// --------------------------------------------
// Media
// --------------------------------------------

const mediaTsInterface = isV5
  ? `import { MediaFormat } from './MediaFormat';

export interface Media {
  documentId: number;
  name: string;
  alternativeText: string;
  caption: string;
  width: number;
  height: number;
  formats: { thumbnail: MediaFormat; medium: MediaFormat; small: MediaFormat; };
  hash: string;
  ext: string;
  mime: string;
  size: number;
  url: string;
  previewUrl: string;
  provider: string;
  createdAt: Date;
  updatedAt: Date;
}
`
  : `import { MediaFormat } from './MediaFormat';

export interface Media {
  id: number;
  attributes: {
    name: string;
    alternativeText: string;
    caption: string;
    width: number;
    height: number;
    formats: { thumbnail: MediaFormat; medium: MediaFormat; small: MediaFormat; };
    hash: string;
    ext: string;
    mime: string;
    size: number;
    url: string;
    previewUrl: string;
    provider: string;
    createdAt: Date;
    updatedAt: Date;
  }
}
`;

fs.writeFileSync(`${typesDir}/Media.ts`, mediaTsInterface);

// --------------------------------------------
// API Types
// --------------------------------------------

var apiFolders;
try {
  apiFolders = fs.readdirSync('./src/api').filter((x) => !x.startsWith('.'));
} catch (e) {
  console.log('No API types found. Skipping...');
}

if (apiFolders)
  for (const apiFolder of apiFolders) {
    const interfaceName = pascalCase(apiFolder);
    const interface = createInterface(
      `./src/api/${apiFolder}/content-types/${apiFolder}/schema.json`,
      interfaceName,
      isV5
    );
    if (interface)
      fs.writeFileSync(`${typesDir}/${interfaceName}.ts`, interface);
  }

// --------------------------------------------
// Components
// --------------------------------------------

var componentCategoryFolders;
try {
  componentCategoryFolders = fs.readdirSync('./src/components');
} catch (e) {
  console.log('No Component types found. Skipping...');
}

if (componentCategoryFolders) {
  const targetFolder = 'types/components';

  if (!fs.existsSync(targetFolder)) fs.mkdirSync(targetFolder);

  for (const componentCategoryFolder of componentCategoryFolders) {
    var componentSchemas = fs.readdirSync(
      `./src/components/${componentCategoryFolder}`
    );
    for (const componentSchema of componentSchemas) {
      const interfaceName = pascalCase(componentSchema.replace('.json', ''));
      const interface = createComponentInterface(
        `./src/components/${componentCategoryFolder}/${componentSchema}`,
        interfaceName,
        isV5
      );
      if (interface)
        fs.writeFileSync(`${targetFolder}/${interfaceName}.ts`, interface);
    }
  }
}



// --------------------------------------------
// API Routes
// --------------------------------------------
const routesDir = 'types/routes';

if (!fs.existsSync(routesDir)) fs.mkdirSync(routesDir);

if (apiFolders) {
  const routes = apiFolders.map((apiFolder) => {
    const schemaPath = `./src/api/${apiFolder}/content-types/${apiFolder}/schema.json`;
    const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
    const routeName = pascalCase(apiFolder);
    const name = schema.kind === 'collectionType' ? schema.info.pluralName : schema.info.singularName;

    return { routeName, name, kind: schema.kind };
  });

  const sortedRoutes = routes.sort((a, b) => {
    if (a.kind === b.kind) return a.name.localeCompare(b.name);
    return a.kind === 'collectionType' ? -1 : 1;
  });

  const collections = sortedRoutes
    .filter((route) => route.kind === 'collectionType')
    .map((route) => `${route.routeName} = "${route.name}"`)
    .join(',\n');

  const singleTypes = sortedRoutes
    .filter((route) => route.kind === 'singleType')
    .map((route) => `${route.routeName} = "${route.name}"`)
    .join(',\n');

  const routesEnum = `export enum StrapiRoute {
  /* collections */
  ${collections},

  /* singleTypes */
  ${singleTypes}
  }`;

  fs.writeFileSync(`${routesDir}/StrapiRoute.ts`, routesEnum);
}
