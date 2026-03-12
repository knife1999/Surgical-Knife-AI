import {uxp} from "../globals";

const fsLS = (uxp as any).storage.localFileSystem;

const AUTH_HOST = "https://api.xiasanqi.com";
const TOKEN_FILE = "device_token.key";
const SETTING_FILE = "cloud_setting.json";
const USER_FILE = "cloud_user.json";
const XOR_KEY = "xsq2026banana";

type CloudSetting = {
  remember: boolean;
  email: string;
  password: string;
  offlineMode: boolean;
};

const globalAuthParams = {
  app: "Ps.sdui",
  locale: "zh",
  vcname: "3.6.0",
  vc: 360,
  ip: "127.0.0.1",
  hostVersion: "22.0.1",
  access_token: "",
  email: "",
};

let cachedTokenKey = "";
let cloudSetting: CloudSetting = {
  remember: false,
  email: "",
  password: "",
  offlineMode: false,
};

const writeFile = async (fileName: string, content: string) => {
  try {
    const folder = await fsLS.getDataFolder();
    const file = await folder.createFile(fileName, {overwrite: true});
    await file.write(content);
  } catch (error) {
    console.warn("[ForgeCloud] 写文件失败", fileName, (error as Error)?.message || error);
  }
};

const readFile = async (fileName: string): Promise<string | null> => {
  try {
    const folder = await fsLS.getDataFolder();
    const file = await folder.getEntry(fileName);
    return await file.read();
  } catch {
    return null;
  }
};

const createRandomString = (length: number) => {
  const seeds = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let index = 0; index < length; index += 1) {
    result += seeds.charAt(Math.floor(Math.random() * seeds.length));
  }
  return result;
};

const getTokenKey = async () => {
  if (cachedTokenKey.length >= 16) return cachedTokenKey;
  const saved = await readFile(TOKEN_FILE);
  if (saved && saved.trim().length >= 16) {
    cachedTokenKey = saved.trim();
    return cachedTokenKey;
  }
  cachedTokenKey = createRandomString(32);
  await writeFile(TOKEN_FILE, cachedTokenKey);
  return cachedTokenKey;
};

const loadCloudSetting = async () => {
  try {
    const raw = await readFile(SETTING_FILE);
    if (!raw) return cloudSetting;
    const parsed = JSON.parse(raw);
    cloudSetting = {
      remember: Boolean(parsed?.remember),
      email: String(parsed?.email ?? ""),
      password: String(parsed?.password ?? ""),
      offlineMode: Boolean(parsed?.offlineMode),
    };
  } catch {
    // Keep defaults.
  }
  return cloudSetting;
};

const saveCloudSetting = async () => {
  await writeFile(SETTING_FILE, JSON.stringify(cloudSetting));
};

const updateCloudSetting = async (partial: Partial<CloudSetting>) => {
  cloudSetting = {
    ...cloudSetting,
    ...partial,
  };
  await saveCloudSetting();
  return cloudSetting;
};

export const getRememberedSetting = async () => {
  await loadCloudSetting();
  return {
    remember: cloudSetting.remember,
    email: cloudSetting.email,
    password: cloudSetting.password,
  };
};

const setAuthParams = (params: Partial<typeof globalAuthParams>) => {
  Object.assign(globalAuthParams, params || {});
};

const authRequest = async (action: string, params?: Record<string, any>) => {
  const tokenKey = await getTokenKey();
  const queryParams = {
    ...globalAuthParams,
    tokenKey,
  };
  const query = Object.keys(queryParams)
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(String((queryParams as any)[key] ?? ""))}`)
    .join("&");
  const response = await fetch(`${AUTH_HOST}${action}?${query}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${globalAuthParams.access_token}`,
    },
    body: JSON.stringify(params || {}),
  });
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return {errno: -1, info: `响应不是有效JSON: ${text.slice(0, 100)}`};
  }
};

const xorEncrypt = (text: string) => {
  const result: number[] = [];
  for (let index = 0; index < text.length; index += 1) {
    result.push(text.charCodeAt(index) ^ XOR_KEY.charCodeAt(index % XOR_KEY.length));
  }
  return btoa(String.fromCharCode(...result));
};

const xorDecrypt = (encoded: string) => {
  try {
    const decoded = atob(encoded);
    const result: number[] = [];
    for (let index = 0; index < decoded.length; index += 1) {
      result.push(decoded.charCodeAt(index) ^ XOR_KEY.charCodeAt(index % XOR_KEY.length));
    }
    return String.fromCharCode(...result);
  } catch {
    return "";
  }
};

const apiLogin = async (email: string, password: string) =>
  authRequest("/auth/login", {email, password});

export const apiGetUserPoints = async () =>
  authRequest("/auth/getUserPoint", {});

export const apiConsumePoints = async (params: Record<string, any>) =>
  authRequest("/auth/consumePointsByRule", params);

export const apiGetExposedPublicUrl = async () => {
  try {
    const res = await authRequest("/web/getExposedPublicUrl", {});
    const url = String(res?.url || res?.data?.url || "").trim();
    if (url) {
      return {success: true, encrypted: xorEncrypt(url), url};
    }
  } catch {
    // Try fallback.
  }

  try {
    const res = await authRequest("/web/listPublicUrls", {only_exposed: 1});
    const records = Array.isArray(res?.data?.records) ? res.data.records : [];
    const exposed = records.find((item: any) => Number(item?.is_exposed) === 1 && String(item?.url || "").trim());
    if (exposed?.url) {
      return {success: true, encrypted: xorEncrypt(String(exposed.url)), url: String(exposed.url)};
    }
  } catch {
    // Fall through.
  }

  return {success: false, error: "未获取到云Forge地址"};
};

export const performLogin = async (email: string, password: string, remember = false) => {
  await loadCloudSetting();
  const res = await apiLogin(email, password);
  if (Number(res?.errno) !== 0) {
    return {success: false, message: String(res?.info || "登录失败")};
  }

  if (remember) {
    await updateCloudSetting({remember: true, email, password, offlineMode: false});
  } else {
    await updateCloudSetting({remember: false, email: "", password: "", offlineMode: false});
  }

  await writeFile(USER_FILE, JSON.stringify(res));
  setAuthParams({
    email: String(res?.email || email || ""),
    access_token: String(res?.access_token || ""),
  });
  return {success: true, user: res};
};

export const tryRestoreSession = async () => {
  const setting = await loadCloudSetting();
  const saved = await readFile(USER_FILE);
  if (!saved) {
    return {success: false, setting};
  }
  try {
    const user = JSON.parse(saved);
    if (String(user?.access_token || "").trim()) {
      setAuthParams({
        email: String(user?.email || ""),
        access_token: String(user?.access_token || ""),
      });
      return {success: true, user, setting};
    }
  } catch {
    // Fall through.
  }
  return {success: false, setting};
};

export const performLogout = async (email: string) => {
  await loadCloudSetting();
  if (!cloudSetting.offlineMode && String(email || "").trim()) {
    try {
      await authRequest("/auth/logout", {email});
    } catch {
      // Ignore logout API failures.
    }
  }
  setAuthParams({email: "", access_token: ""});
  return {success: true};
};

export const testCloudForgeConnection = async (encryptedUrl: string) => {
  let url = xorDecrypt(String(encryptedUrl || ""));
  if (!url) {
    return {success: false, error: "无效的云服务URL"};
  }
  url = url.replace(/\/+$/, "");
  try {
    const response = await fetch(`${url}/sdapi/v1/sd-models`, {method: "GET"});
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const models = await response.json();
    if (Array.isArray(models) && models.length > 0) {
      return {success: true, encrypted: encryptedUrl, modelCount: models.length};
    }
    return {success: false, error: "云Forge服务暂时不可用"};
  } catch (error) {
    return {success: false, error: `云Forge服务暂时不可用 (${(error as Error)?.message || error})`};
  }
};

export const decryptUrl = (encryptedUrl: string) => xorDecrypt(String(encryptedUrl || ""));
