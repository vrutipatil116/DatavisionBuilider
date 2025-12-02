import { useSnapshot } from "valtio";
import { dataStore, loadDataStore } from "../store/dataStore";
import { ExcelParseResult } from '../types';

export function useDataStore() {
  const snap = useSnapshot(dataStore);

  return {
    originalData: snap.originalData as ExcelParseResult | null,
    cleanedData: snap.cleanedData as ExcelParseResult | null,
    fixes: snap.fixes,

    setOriginalData: (data: ExcelParseResult | null) => {
      dataStore.originalData = data;
    },
    setCleanedData: (data: ExcelParseResult | null, fixes?: string[]) => {
      dataStore.cleanedData = data;
      if (fixes) dataStore.fixes = fixes;
    },
    resetStore: () => {
      dataStore.originalData = null;
      dataStore.cleanedData = null;
      dataStore.fixes = null;
    }
  };
}
