declare module 'multer' {
  import { RequestHandler } from 'express';

  interface MulterOptions {
    storage?: any;
    limits?: {
      fieldNameSize?: number;
      fieldSize?: number;
      fields?: number;
      fileSize?: number;
      files?: number;
      parts?: number;
      headerPairs?: number;
    };
    fileFilter?: (req: any, file: any, cb: (error: Error | null, acceptFile: boolean) => void) => void;
  }

  interface StorageEngine {}

  function multer(options?: MulterOptions): {
    single(fieldname: string): RequestHandler;
    array(fieldname: string, maxCount?: number): RequestHandler;
    fields(fields: Array<{ name: string; maxCount?: number }>): RequestHandler;
    none(): RequestHandler;
  };

  namespace multer {
    export function memoryStorage(): StorageEngine;
    export function diskStorage(opts: any): StorageEngine;
  }

  export = multer;
}
