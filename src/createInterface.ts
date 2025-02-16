import { Project, TypeNode } from 'ts-morph';
import * as fs from 'fs';
import { pascalCase, isOptional } from './utils'; // Assuming you have these utilities
import { StrapiAttribute, StrapiSchema } from './schema';

interface ImportInfo {
  type: string;
  path: string;
}

const typesDir = 'types';

export function generateInterfaces() {
  if (!fs.existsSync(typesDir)) fs.mkdirSync(typesDir);

  var apiFolders;
  try {
    apiFolders = fs.readdirSync('./src/api').filter((x) => !x.startsWith('.'));
  } catch (e) {
    console.log('No API types found. Skipping...');
  }

  if (apiFolders)
    for (const apiFolder of apiFolders) {
      const interfaceName = pascalCase(apiFolder);
      const interfacez = generateInterfaceFromSchema(
        `./src/api/${apiFolder}/content-types/${apiFolder}/schema.json`,
        interfaceName
      );
      if (interfacez)
        fs.writeFileSync(`${typesDir}/${interfaceName}.ts`, interfacez);
    }
}
function generateInterfaceFromSchema(
  schemaPath: string,
  interfaceName: string
): string | null {
  try {
    const schemaFile = fs.readFileSync(schemaPath, 'utf8');
    const schema = JSON.parse(schemaFile) as StrapiSchema;

    const project = new Project();
    const sourceFile = project.createSourceFile('temp.ts'); // Temporary source file

    const interfaceDeclaration = sourceFile.addInterface({
      name: interfaceName,
      isExported: true,
    });

    interfaceDeclaration.addProperty({
      name: 'id',
      type: 'number',
    });

    const attributesProperty = interfaceDeclaration.addProperty({
      name: 'attributes',
      type: '{}', // Placeholder, will be refined
    });

    const attributesInterface = sourceFile.addInterface({
      name: `${interfaceName}Attributes`,
      isExported: false, // Not exported directly
    });

    attributesProperty.setType(attributesInterface.getName()); // Link attributes property to the new interface

    const imports: ImportInfo[] = [];

    for (const [attributeName, attributeValue] of Object.entries(
      schema.attributes
    )) {
      const propertyName = isOptional(attributeValue)
        ? `${attributeName}?`
        : attributeName;
      let propertyType: TypeNode | string = 'any';

      switch (attributeValue.type) {
        case 'relation':
          propertyType = handleRelation(attributeValue, imports);
          break;
        case 'component':
          propertyType = handleComponent(attributeValue, imports);
          break;
        case 'dynamiczone':
          propertyType = handleDynamicZone(attributeValue, imports);
          break;
        case 'media':
          propertyType = handleMedia(attributeValue);
          break;
        case 'enumeration':
          propertyType = handleEnumeration(attributeValue);
          break;
        case 'string':
        case 'text':
        case 'richtext':
        case 'email':
        case 'uid':
          propertyType = 'string';
          break;
        case 'integer':
        case 'biginteger':
        case 'decimal':
        case 'float':
          propertyType = 'number';
          break;
        case 'date':
        case 'datetime':
        case 'time':
          propertyType = 'Date';
          break;
        case 'boolean':
          propertyType = 'boolean';
          break;
        default:
          break;
      }

      attributesInterface.addProperty({
        name: propertyName,
        type: propertyType,
      });
    }

    if (schema.pluginOptions?.i18n?.localized) {
      attributesInterface.addProperty({ name: 'locale', type: 'string' });
      attributesInterface.addProperty({
        name: 'localizations?',
        type: `{ data: ${interfaceName}[] }`,
      });
    }

    // Add imports
    imports.forEach((importInfo) => {
      sourceFile.addImportDeclaration({
        moduleSpecifier: importInfo.path,
        namedImports: [importInfo.type],
      });
    });

    return sourceFile.getText();
  } catch (e) {
    console.error(`Error processing schema ${schemaPath}:`, e);
    return null;
  }
}

// Helper functions for attribute type handling (example)

function handleRelation(attributeValue: any, imports: ImportInfo[]): string {
  const targetType = attributeValue.target.includes('::user')
    ? 'User'
    : pascalCase(attributeValue.target.split('.')[1]);
  addImport(imports, targetType, `./${targetType}`);
  const isArray = attributeValue.relation.endsWith('ToMany');
  return `{ data: ${targetType}${isArray ? '[]' : ''} }`;
}

function handleComponent(attributeValue: any, imports: ImportInfo[]): string {
  const componentType =
    attributeValue.target === 'plugin::users-permissions.user'
      ? 'User'
      : pascalCase(attributeValue.component.split('.')[1]);
  addImport(imports, componentType, `./components/${componentType}`);
  const isArray = attributeValue.repeatable;
  return `${componentType}${isArray ? '[]' : ''}`;
}

function handleDynamicZone(
  attributeValue: StrapiAttribute,
  imports: ImportInfo[]
): string {
  const componentTypes =
    attributeValue.components?.map((componentName: string) =>
      pascalCase(componentName.split('.')[1])
    ) ?? [];
  componentTypes.forEach((componentType) =>
    addImport(imports, componentType, `./components/${componentType}`)
  );
  return `${componentTypes.join(' | ')}[]`;
}

function handleMedia(attributeValue: any): string {
  return `{ data: Media${attributeValue.multiple ? '[]' : ''} }`;
}

function handleEnumeration(attributeValue: any): string {
  return attributeValue.enum.map((v: string) => `'${v}'`).join(' | ');
}

function addImport(imports: ImportInfo[], type: string, path: string) {
  if (imports.every((x) => x.path !== path || x.type !== type)) {
    imports.push({ type, path });
  }
}

export default generateInterfaceFromSchema;
