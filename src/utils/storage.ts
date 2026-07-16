// 存储数据

import { isProduction } from "@/config";

export function setStorageData(keyName: string, data: object) {
  return new Promise((resolve) => {
    if (isProduction) {
      chrome.storage.local.set({ [keyName]: data }, () => resolve(true));
    } else {
      window.localStorage.setItem(keyName, JSON.stringify(data));
      resolve(true);
    }
  });
}

export function getStorageData(key: string) {
  return new Promise((resolve) => {
    if (isProduction) {
      chrome.storage.local.get([key], (result) => resolve(result));
    } else {
      try {
        const data: string | null = window.localStorage.getItem(key) || '{}';
        resolve(JSON.parse(data));
      } catch (error) { resolve(null); }
    }
  });
}
