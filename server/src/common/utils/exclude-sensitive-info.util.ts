import { User } from '../../users/user.entity';

/**
 * 從使用者物件中移除敏感資訊
 * @param user 使用者物件
 * @returns 不含敏感資訊的使用者物件
 */
export function excludeSensitiveUserInfo(user: User): Partial<User> {
  if (!user) return user;
  
  const { password, refreshToken, ...userWithoutSensitiveInfo } = user;
  return userWithoutSensitiveInfo as User;
}

/**
 * 從包含使用者的物件中移除敏感資訊
 * @param obj 包含使用者的物件
 * @returns 不含敏感資訊的物件
 */
export function excludeSensitiveInfo<T extends { users?: User[] }>(obj: T): T {
  if (!obj) return obj;
  
  // 深層複製物件以避免修改原始物件
  const result = { ...obj } as T;
  
  // 如果物件有 users 屬性且為陣列，則對每個使用者移除敏感資訊
  if (result.users && Array.isArray(result.users)) {
    result.users = result.users.map(user => excludeSensitiveUserInfo(user)) as User[];
  }
  
  return result;
}

/**
 * 從物件陣列中移除敏感資訊
 * @param array 包含使用者的物件陣列
 * @returns 不含敏感資訊的物件陣列
 */
export function excludeSensitiveInfoFromArray<T extends { users?: User[] }>(array: T[]): T[] {
  if (!array || !Array.isArray(array)) return array;
  
  return array.map(item => excludeSensitiveInfo(item));
}
