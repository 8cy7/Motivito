import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  PARENT_ACCESS_TOKEN: '@motivito_parent_access_token',
  PARENT_REFRESH_TOKEN: '@motivito_parent_refresh_token',
  PARENT_EMAIL: '@motivito_parent_email',
  PARENT_INFO: '@motivito_parent_info',
  CHILD_ACCESS_TOKEN: '@motivito_child_access_token',
  CHILD_INFO: '@motivito_child_info',
  CHILD_ID: '@motivito_child_id',
};

// Parent tokens
export async function saveParentTokens(accessToken: string, refreshToken: string) {
  await AsyncStorage.multiSet([
    [KEYS.PARENT_ACCESS_TOKEN, accessToken],
    [KEYS.PARENT_REFRESH_TOKEN, refreshToken],
  ]);
}

export async function getParentAccessToken(): Promise<string | null> {
  return AsyncStorage.getItem(KEYS.PARENT_ACCESS_TOKEN);
}

export async function getParentRefreshToken(): Promise<string | null> {
  return AsyncStorage.getItem(KEYS.PARENT_REFRESH_TOKEN);
}

export async function saveParentEmail(email: string) {
  await AsyncStorage.setItem(KEYS.PARENT_EMAIL, email);
}

export async function getParentEmail(): Promise<string | null> {
  return AsyncStorage.getItem(KEYS.PARENT_EMAIL);
}

export async function saveParentInfo(info: object) {
  await AsyncStorage.setItem(KEYS.PARENT_INFO, JSON.stringify(info));
}

export async function getParentInfo(): Promise<any | null> {
  const raw = await AsyncStorage.getItem(KEYS.PARENT_INFO);
  return raw ? JSON.parse(raw) : null;
}

export async function clearParentData() {
  await AsyncStorage.multiRemove([
    KEYS.PARENT_ACCESS_TOKEN,
    KEYS.PARENT_REFRESH_TOKEN,
    KEYS.PARENT_INFO,
  ]);
}

// Child tokens
export async function saveChildData(accessToken: string, childInfo: object, childId: string) {
  await AsyncStorage.multiSet([
    [KEYS.CHILD_ACCESS_TOKEN, accessToken],
    [KEYS.CHILD_INFO, JSON.stringify(childInfo)],
    [KEYS.CHILD_ID, childId],
  ]);
}

export async function getChildAccessToken(): Promise<string | null> {
  return AsyncStorage.getItem(KEYS.CHILD_ACCESS_TOKEN);
}

export async function getChildInfo(): Promise<any | null> {
  const raw = await AsyncStorage.getItem(KEYS.CHILD_INFO);
  return raw ? JSON.parse(raw) : null;
}

export async function getChildId(): Promise<string | null> {
  return AsyncStorage.getItem(KEYS.CHILD_ID);
}

export async function clearChildData() {
  await AsyncStorage.multiRemove([
    KEYS.CHILD_ACCESS_TOKEN,
    KEYS.CHILD_INFO,
    KEYS.CHILD_ID,
  ]);
}

// Pending approval task IDs — persisted so celebration survives app restart
const PENDING_APPROVAL_KEY = '@motivito_pending_approval_tasks';

export async function addPendingApprovalTask(taskId: string): Promise<void> {
  const raw = await AsyncStorage.getItem(PENDING_APPROVAL_KEY);
  const ids: string[] = raw ? JSON.parse(raw) : [];
  if (!ids.includes(taskId)) {
    await AsyncStorage.setItem(PENDING_APPROVAL_KEY, JSON.stringify([...ids, taskId]));
  }
}

export async function getPendingApprovalTasks(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(PENDING_APPROVAL_KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function removePendingApprovalTasks(taskIds: string[]): Promise<void> {
  const raw = await AsyncStorage.getItem(PENDING_APPROVAL_KEY);
  const ids: string[] = raw ? JSON.parse(raw) : [];
  const remaining = ids.filter(id => !taskIds.includes(id));
  await AsyncStorage.setItem(PENDING_APPROVAL_KEY, JSON.stringify(remaining));
}
