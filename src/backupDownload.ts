type JsonWritableFile = {
  readonly write: (data: Blob) => Promise<void>;
  readonly close: () => Promise<void>;
};

type JsonFileHandle = {
  readonly createWritable: () => Promise<JsonWritableFile>;
};

type JsonSaveFilePickerOptions = {
  readonly suggestedName: string;
  readonly types: readonly {
    readonly description: string;
    readonly accept: Readonly<Record<string, readonly string[]>>;
  }[];
};

declare global {
  interface Window {
    readonly showSaveFilePicker?: (options: JsonSaveFilePickerOptions) => Promise<JsonFileHandle>;
  }
}

export type BackupSaveResult = "saved" | "downloaded" | "canceled";

const pad2 = (value: number): string => String(value).padStart(2, "0");

export const backupFileName = (date = new Date()): string =>
  [
    "rebalance-advisor-backup",
    date.getFullYear(),
    pad2(date.getMonth() + 1),
    pad2(date.getDate()),
    pad2(date.getHours()),
    pad2(date.getMinutes()),
  ].join("-") + ".json";

const jsonBlob = (data: object): Blob => new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });

const downloadJson = (fileName: string, data: object) => {
  const url = URL.createObjectURL(jsonBlob(data));
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
};

const isFilePickerCanceled = (error: unknown): boolean =>
  error instanceof DOMException && error.name === "AbortError";

export const saveBackupJson = async (fileName: string, data: object): Promise<BackupSaveResult> => {
  const picker = window.showSaveFilePicker;
  if (picker === undefined) {
    downloadJson(fileName, data);
    return "downloaded";
  }

  try {
    const handle = await picker({
      suggestedName: fileName,
      types: [
        {
          description: "JSON 백업 파일",
          accept: { "application/json": [".json"] },
        },
      ],
    });
    const writable = await handle.createWritable();
    await writable.write(jsonBlob(data));
    await writable.close();
    return "saved";
  } catch (error) {
    if (isFilePickerCanceled(error)) {
      return "canceled";
    }
    throw error;
  }
};
