import { StrapiAttribute } from './schema';
import { pascalCase as pc } from 'change-case';

export const pascalCase = (str: string): string => {
  return pc(str);
};

export const isOptional = (attributeValue: StrapiAttribute): boolean => {
  if (attributeValue.relation === 'oneToMany' || attributeValue.repeatable) {
    return false;
  }
  return attributeValue.required !== true;
};
