export enum AUTH_STATUS {
  INIT = "INIT",
  NO_ACCESS = "no_access",
  LOGGED_IN = "logged_in",
  LOGGING = "logging",
  GET_USER_INFO = "get_user_info",
  LOGGED_OUT = "logged_out",
}

export enum AUTH_ERROR_FALLBACKS {
  CreateSessionError = "Unknown Error during Create Session",
  DestorySessionError = "Unknown Error during Destroy Session",
  GetSessionError = "Unknown Error During Get Session",
  Unauthorized = "User Unauthorized",
}
