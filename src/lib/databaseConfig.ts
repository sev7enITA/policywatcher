import { configuredDatabaseUrl, getDatabaseUrl, getSqliteFilePath } from './databaseUrl';

export interface DatabaseDiagnostics {
  configured: boolean;
  url: string;
  filePath: string | null;
  directoryPath: string | null;
  directoryExists: boolean;
  directoryWritable: boolean;
  fileExists: boolean;
  fileReadable: boolean;
  fileWritable: boolean;
  fileSizeBytes: number;
}

export async function getDatabaseDiagnostics(): Promise<DatabaseDiagnostics> {
  const [{ default: fs }, { default: path }] = await Promise.all([
    import('fs'),
    import('path'),
  ]);

  const url = getDatabaseUrl();
  const filePath = getSqliteFilePath(url);
  const directoryPath = filePath ? path.dirname(filePath) : null;
  const directoryExists = directoryPath ? fs.existsSync(directoryPath) : false;
  let directoryWritable = false;

  if (directoryPath && directoryExists) {
    try {
      fs.accessSync(directoryPath, fs.constants.W_OK);
      directoryWritable = true;
    } catch {
      directoryWritable = false;
    }
  }

  const fileExists = filePath ? fs.existsSync(filePath) : false;
  let fileReadable = false;
  let fileWritable = false;
  if (filePath && fileExists) {
    try {
      fs.accessSync(filePath, fs.constants.R_OK);
      fileReadable = true;
    } catch {
      fileReadable = false;
    }
    try {
      fs.accessSync(filePath, fs.constants.W_OK);
      fileWritable = true;
    } catch {
      fileWritable = false;
    }
  }
  const fileSizeBytes = filePath && fileExists ? fs.statSync(filePath).size : 0;

  return {
    configured: Boolean(configuredDatabaseUrl()),
    url,
    filePath,
    directoryPath,
    directoryExists,
    directoryWritable,
    fileExists,
    fileReadable,
    fileWritable,
    fileSizeBytes,
  };
}
