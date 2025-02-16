export type StrapiSchema = {
  kind: string;
  collectionName: string;
  info: {
    singularName: string;
    pluralName: string;
    displayName: string;
    description: string;
  };
  options: {
    draftAndPublish: boolean;
  };
  pluginOptions: {
    i18n: {
      localized: boolean;
    };
  };
  attributes: {
    [attributeName: string]: StrapiAttribute;
  };
};

export type StrapiAttribute = {
  type:
    | 'string'
    | 'text'
    | 'richtext'
    | 'email'
    | 'uid'
    | 'password'
    | 'integer'
    | 'biginteger'
    | 'float'
    | 'decimal'
    | 'date'
    | 'time'
    | 'datetime'
    | 'timestamp'
    | 'boolean'
    | 'json'
    | 'enumeration'
    | 'media'
    | 'relation'
    | 'component'
    | 'dynamiczone';
  regex?: string;
  unique?: boolean;
  targetField?: string;
  default?: string | number | boolean | object | null;
  min?: number;
  max?: number;
  enum?: string[];
  relation?: string;
  target?: string;
  inversedBy?: string;
  multiple?: boolean;
  allowedTypes?: Array<string>;
  component?: string;
  repeatable?: boolean;
  displayName?: string;
  components?: string[];
  customField?: string;
  options?: {
    preset?: string;
    maxLengthWords?: number;
  };
  required?: boolean;
  pluginOptions?: {
    i18n?: {
      localized: boolean;
    };
  };
};
