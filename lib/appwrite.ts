// Appwrite integration boundary.
// Add NEXT_PUBLIC_APPWRITE_ENDPOINT and NEXT_PUBLIC_APPWRITE_PROJECT_ID.
// Keep UI independent from the SDK so mock mode can be replaced safely.
export const appwriteConfig={endpoint:process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT??"",projectId:process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID??""};
export const isAppwriteConfigured=Boolean(appwriteConfig.endpoint&&appwriteConfig.projectId);