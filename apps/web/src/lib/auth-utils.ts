import { NextRequest } from "next/server";

export interface AuthUser {
  id: string;
  email: string;
}

export function getAuthUserFromReqCookies(request: NextRequest) {
  try {
    const userDataCookie = request.cookies.get("app-auth");

    if (!userDataCookie?.value) {
      return null;
    }

    const userData = JSON.parse(userDataCookie.value);

    if (!userData.id || !userData.email) {
      return null;
    }

    return { id: userData.id, email: userData.email };
  } catch (error) {
    console.error("Auth verification error:", error);
    return null;
  }
}
